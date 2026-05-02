
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('internships', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='internshipoffer',
            name='source',
            field=models.CharField(blank=True, max_length=100, null=True, verbose_name='Source'),
        ),
    ]
