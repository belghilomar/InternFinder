
import django.utils.timezone
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='InternshipOffer',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=500, verbose_name='Titre')),
                ('company', models.CharField(blank=True, max_length=300, null=True, verbose_name='Société')),
                ('location', models.CharField(blank=True, max_length=200, null=True, verbose_name='Localisation')),
                ('date_posted', models.CharField(blank=True, max_length=100, null=True, verbose_name='Date de publication')),
                ('url', models.URLField(max_length=1000, verbose_name='URL')),
                ('search_keyword', models.CharField(max_length=200, verbose_name='Mot-clé recherché')),
                ('description', models.TextField(blank=True, null=True, verbose_name='Description')),
                ('created_at', models.DateTimeField(default=django.utils.timezone.now, verbose_name='Date de découverte')),
            ],
            options={
                'verbose_name': 'Offre de stage',
                'verbose_name_plural': 'Offres de stage',
                'ordering': ['-created_at'],
            },
        ),
        migrations.CreateModel(
            name='SearchHistory',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('keyword', models.CharField(max_length=200)),
                ('location', models.CharField(default='Tunisie', max_length=200)),
                ('results_count', models.IntegerField(default=0)),
                ('searched_at', models.DateTimeField(default=django.utils.timezone.now)),
            ],
            options={
                'ordering': ['-searched_at'],
            },
        ),
    ]
