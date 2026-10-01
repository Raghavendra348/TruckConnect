from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from drivers.models import Driver
from drivers.serializers import DriverSerializer

from .permissions import IsAdminUser


class AdminDriverListView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def get(self, request):
        drivers = (
            Driver.objects
            .select_related("owner")
            .order_by("verification_status", "-created_at")
        )
        serializer = DriverSerializer(drivers, many=True, context={"request": request})
        return Response(
            {
                "message": "Drivers retrieved successfully.",
                "count": drivers.count(),
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


class AdminDriverVerificationUpdateView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser]

    def patch(self, request, driver_id):
        try:
            driver = Driver.objects.select_related("owner").get(
                id=driver_id
            )
        except Driver.DoesNotExist:
            return Response(
                {
                    "message": "Driver not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        verification_status = request.data.get(
            "verification_status"
        )

        allowed_statuses = [
            Driver.VerificationStatus.PENDING,
            Driver.VerificationStatus.VERIFIED,
            Driver.VerificationStatus.REJECTED,
        ]

        if verification_status not in allowed_statuses:
            return Response(
                {
                    "verification_status": (
                        "Invalid verification status. "
                        "Allowed values are: pending, verified, rejected."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        driver.verification_status = verification_status
        driver.save(
            update_fields=[
                "verification_status",
                "updated_at",
            ]
        )

        return Response(
            {
                "message": "Driver verification status updated successfully.",
                "data": {
                    "id": driver.id,
                    "owner": driver.owner_id,
                    "owner_name": driver.owner.full_name,
                    "full_name": driver.full_name,
                    "verification_status": driver.verification_status,
                    "verification_status_display": (
                        driver.get_verification_status_display()
                    ),
                    "status": driver.status,
                    "status_display": driver.get_status_display(),
                },
            },
            status=status.HTTP_200_OK,
        )