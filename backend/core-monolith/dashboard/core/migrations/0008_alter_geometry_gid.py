# Generated by Django 4.1.7 on 2023-04-03 23:31

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0007_alter_geometry_gid"),
    ]

    operations = [
        migrations.AlterField(
            model_name="geometry",
            name="gid",
            field=models.CharField(
                auto_created=True,
                max_length=50,
                primary_key=True,
                serialize=False,
                unique=True,
            ),
        ),
    ]
