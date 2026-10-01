from django.db import models


class Expense(models.Model):
    EXPENSE_TYPES = [
        ("fuel", "Fuel"),
        ("toll", "Toll"),
        ("maintenance", "Maintenance"),
        ("food", "Food"),
        ("parking", "Parking"),
        ("other", "Other"),
    ]

    trip = models.ForeignKey(
        "trips.Trip",
        on_delete=models.CASCADE,
        related_name="expenses",
    )

    expense_type = models.CharField(
        max_length=30,
        choices=EXPENSE_TYPES,
    )

    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    description = models.TextField(
        blank=True,
        null=True,
    )

    expense_date = models.DateField()

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.expense_type} - {self.amount}"