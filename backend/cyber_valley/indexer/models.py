from django.db import models


class LastProcessedBlock(models.Model):
    """
    Stores the block number up to which the contract indexer has processed events.
    There should only be one instance of this model (PK=1).
    """

    id = models.PositiveSmallIntegerField(primary_key=True, default=1)
    block_number = models.PositiveIntegerField(null=False)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self) -> str:
        return f"Last Processed Block: {self.block_number}"

    class Meta:
        verbose_name = "Last Processed Block"
        verbose_name_plural = "Last Processed Block"


class LogProcessingError(models.Model):
    block_number = models.PositiveIntegerField()
    log_receipt = models.TextField()
    tx_hash = models.TextField()
    error = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
