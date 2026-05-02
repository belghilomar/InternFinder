
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('internships', '0003_remove_internshipoffer_source_internshipoffer_domain_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='internshipoffer',
            name='search_keyword',
            field=models.CharField(db_index=True, max_length=200, verbose_name='Mot-clé recherché'),
        ),
        migrations.AlterField(
            model_name='internshipoffer',
            name='title',
            field=models.CharField(db_index=True, max_length=500, verbose_name='Titre'),
        ),
        migrations.AddIndex(
            model_name='internshipoffer',
            index=models.Index(fields=['search_keyword', '-created_at'], name='internships_search__1c294a_idx'),
        ),
    ]
