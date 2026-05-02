
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('internships', '0002_internshipoffer_source'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='internshipoffer',
            name='source',
        ),
        migrations.AddField(
            model_name='internshipoffer',
            name='domain',
            field=models.CharField(blank=True, max_length=100, null=True, verbose_name='Domaine'),
        ),
        migrations.AddField(
            model_name='internshipoffer',
            name='type',
            field=models.CharField(blank=True, max_length=50, null=True, verbose_name='Type (Remote/On-site/Hybrid)'),
        ),
    ]
