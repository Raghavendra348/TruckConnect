from decimal import Decimal

from django.db import models, transaction
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from notifications.services import create_notification
from trips.models import Trip

from .models import Payment, PaymentTransaction
from .serializers import PaymentSerializer, PaymentTransactionSerializer


class PaymentListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Clean up any previously auto-generated placeholder settlement transactions
        PaymentTransaction.objects.filter(payment_reference__startswith="SETTLE-").delete()

        # Auto-ensure Payment records exist for all trips with accurate transaction and settlement balances
        all_trips = Trip.objects.select_related("booking", "booking__offer", "load", "truck").prefetch_related("settlements").all()
        for t in all_trips:
            booking = getattr(t, "booking", None)
            latest_settlement = t.settlements.exclude(status__in=["cancelled", "rejected"]).order_by("-created_date").first()
            if latest_settlement and latest_settlement.final_settlement_amount is not None and latest_settlement.final_settlement_amount > Decimal("0.00"):
                agreed_amt = latest_settlement.final_settlement_amount
            else:
                agreed_amt = (
                    getattr(booking, "final_price", None)
                    or getattr(booking, "agreed_price", None)
                    or getattr(getattr(booking, "offer", None), "offered_price", None)
                    or Decimal("15000.00")
                )

            payment, created = Payment.objects.get_or_create(
                trip=t,
                defaults={
                    "agreed_amount": agreed_amt,
                    "total_paid": Decimal("0.00"),
                    "remaining_amount": agreed_amt,
                    "payment_status": Payment.STATUS_UNPAID,
                }
            )

            # Recalculate accurately based on real completed transactions
            actual_paid = sum(
                (tx.amount for tx in payment.transactions.filter(status=PaymentTransaction.STATUS_COMPLETED)),
                Decimal("0.00"),
            )

            payment.agreed_amount = agreed_amt
            payment.total_paid = actual_paid
            payment.remaining_amount = max(payment.agreed_amount - actual_paid, Decimal("0.00"))
            if actual_paid >= payment.agreed_amount and payment.agreed_amount > Decimal("0.00"):
                payment.payment_status = Payment.STATUS_FULLY_PAID
            elif actual_paid > Decimal("0.00"):
                payment.payment_status = Payment.STATUS_PARTIALLY_PAID
            else:
                payment.payment_status = Payment.STATUS_UNPAID

            payment.save(update_fields=["agreed_amount", "total_paid", "remaining_amount", "payment_status", "updated_at"])

        queryset = (
            Payment.objects
            .select_related(
                "trip",
                "trip__booking",
                "trip__booking__customer",
                "trip__booking__owner",
                "trip__load",
                "trip__truck",
            )
            .prefetch_related("transactions")
            .order_by("-created_at")
        )

        if user.is_staff or getattr(user, "role", None) == "admin":
            payments = queryset
        elif getattr(user, "role", None) == "customer":
            payments = queryset.filter(
                models.Q(trip__booking__customer=user) | models.Q(trip__load__customer=user)
            )
        elif getattr(user, "role", None) == "truck_owner":
            payments = queryset.filter(
                models.Q(trip__booking__owner=user) | models.Q(trip__truck__owner=user)
            )
        else:
            payments = queryset.filter(
                models.Q(trip__booking__customer=user)
                | models.Q(trip__booking__owner=user)
                | models.Q(trip__load__customer=user)
                | models.Q(trip__truck__owner=user)
            )

        serializer = PaymentSerializer(payments, many=True)
        return Response(serializer.data)

    def post(self, request):
        trip_id = request.data.get("trip")
        agreed_amount = request.data.get("agreed_amount")
        due_date = request.data.get("due_date")

        if not trip_id:
            return Response(
                {"trip": "This field is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if agreed_amount is None:
            return Response(
                {"agreed_amount": "This field is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            trip = (
                Trip.objects
                .select_related(
                    "booking",
                    "booking__customer",
                    "booking__owner",
                )
                .get(id=trip_id)
            )
        except Trip.DoesNotExist:
            return Response(
                {"trip": "Trip not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if Payment.objects.filter(trip=trip).exists():
            return Response(
                {"trip": "A payment record already exists for this trip."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            agreed_amount = Decimal(str(agreed_amount))
        except Exception:
            return Response(
                {"agreed_amount": "Enter a valid amount."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if agreed_amount <= Decimal("0.00"):
            return Response(
                {"agreed_amount": "Agreed amount must be greater than zero."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment = Payment.objects.create(
            trip=trip,
            agreed_amount=agreed_amount,
            due_date=due_date,
        )

        create_notification(
            recipient=trip.booking.customer,
            notification_type="payment_due",
            title="Payment Due",
            message=(
                f"Payment of {agreed_amount} is due for "
                f"trip {trip.trip_id}. "
                f"Due date: {payment.due_date or 'Not specified'}. "
                f"Remaining amount: {payment.remaining_amount}."
            ),
        )

        serializer = PaymentSerializer(payment)

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )


class PaymentDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, payment_id):
        try:
            payment = (
                Payment.objects
                .select_related(
                    "trip",
                    "trip__booking",
                    "trip__booking__customer",
                    "trip__booking__owner",
                )
                .prefetch_related("transactions")
                .get(id=payment_id)
            )
        except Payment.DoesNotExist:
            return Response(
                {"detail": "Payment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        user = request.user
        if not (user.is_staff or getattr(user, "role", None) == "admin"):
            if payment.trip.booking.customer != user and payment.trip.booking.owner != user:
                return Response(
                    {"detail": "You do not have permission to view this payment."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        serializer = PaymentSerializer(payment)

        return Response(serializer.data)

    def patch(self, request, payment_id):
        try:
            payment = (
                Payment.objects
                .select_related(
                    "trip",
                    "trip__booking",
                    "trip__booking__customer",
                    "trip__booking__owner",
                )
                .get(id=payment_id)
            )
        except Payment.DoesNotExist:
            return Response(
                {"detail": "Payment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        user = request.user
        if not (user.is_staff or getattr(user, "role", None) == "admin"):
            if payment.trip.booking.customer != user and payment.trip.booking.owner != user:
                return Response(
                    {"detail": "You do not have permission to modify this payment."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        allowed_fields = {"agreed_amount", "due_date"}

        for field in request.data.keys():
            if field not in allowed_fields:
                return Response(
                    {
                        field: (
                            "This field cannot be updated from the "
                            "Payment API."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        if "agreed_amount" in request.data:
            try:
                agreed_amount = Decimal(
                    str(request.data["agreed_amount"])
                )
            except Exception:
                return Response(
                    {"agreed_amount": "Enter a valid amount."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if agreed_amount <= Decimal("0.00"):
                return Response(
                    {
                        "agreed_amount": (
                            "Agreed amount must be greater than zero."
                        )
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            payment.agreed_amount = agreed_amount

        if "due_date" in request.data:
            payment.due_date = request.data["due_date"]

        payment.save()

        serializer = PaymentSerializer(payment)

        return Response(serializer.data)


class PaymentTransactionCreateView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, payment_id):
        try:
            payment = (
                Payment.objects
                .select_for_update()
                .select_related(
                    "trip",
                    "trip__booking",
                    "trip__booking__customer",
                    "trip__booking__owner",
                )
                .get(id=payment_id)
            )
        except Payment.DoesNotExist:
            return Response(
                {"detail": "Payment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        user = request.user
        if not (user.is_staff or getattr(user, "role", None) == "admin"):
            if payment.trip.booking.customer != user and payment.trip.booking.owner != user:
                return Response(
                    {"detail": "You do not have permission to record transactions for this payment."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        amount = request.data.get("amount")
        payment_type = request.data.get("payment_type")

        if amount is None:
            return Response(
                {"amount": "This field is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if payment_type is None:
            return Response(
                {"payment_type": "This field is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            amount = Decimal(str(amount))
        except Exception:
            return Response(
                {"amount": "Enter a valid amount."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if amount <= Decimal("0.00"):
            return Response(
                {"amount": "Amount must be greater than zero."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if amount > payment.remaining_amount:
            return Response(
                {
                    "amount": (
                        "Payment amount cannot be greater than "
                        "the remaining amount."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        transaction_serializer = PaymentTransactionSerializer(
            data=request.data
        )

        if not transaction_serializer.is_valid():
            return Response(
                transaction_serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment_transaction = transaction_serializer.save(
            payment=payment,
            created_by=request.user,
        )

        if payment_transaction.status == PaymentTransaction.STATUS_COMPLETED:
            payment.total_paid += amount
            payment.update_payment_status()

            payment.save(
                update_fields=[
                    "total_paid",
                    "remaining_amount",
                    "payment_status",
                    "updated_at",
                ]
            )

            customer = payment.trip.booking.customer
            owner = payment.trip.booking.owner

            if request.user.id == customer.id:
                recipient = owner
            else:
                recipient = customer

            create_notification(
                recipient=recipient,
                notification_type="payment_received",
                title="Payment Received",
                message=(
                    f"Payment of {amount} has been received for "
                    f"trip {payment.trip.trip_id}. "
                    f"Payment reference: "
                    f"{payment_transaction.payment_reference or 'N/A'}."
                ),
            )

        response_serializer = PaymentTransactionSerializer(
            payment_transaction
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
        )


class PaymentTransactionListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, payment_id):
        try:
            payment = (
                Payment.objects
                .select_related(
                    "trip",
                    "trip__booking",
                    "trip__booking__customer",
                    "trip__booking__owner",
                )
                .get(id=payment_id)
            )
        except Payment.DoesNotExist:
            return Response(
                {"detail": "Payment not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        user = request.user
        if not (user.is_staff or getattr(user, "role", None) == "admin"):
            if payment.trip.booking.customer != user and payment.trip.booking.owner != user:
                return Response(
                    {"detail": "You do not have permission to view transactions for this payment."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        transactions = (
            PaymentTransaction.objects
            .filter(payment=payment)
            .order_by("-created_at")
        )

        serializer = PaymentTransactionSerializer(
            transactions,
            many=True,
        )   

        return Response(serializer.data)