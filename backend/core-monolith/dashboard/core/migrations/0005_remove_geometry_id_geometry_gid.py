# Generated by Django 4.1.7 on 2023-04-03 22:57

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0004_remove_geometry_gid"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="geometry",
            name="id",
        ),
        migrations.AddField(
            model_name="geometry",
            name="gid",
            field=models.IntegerField(default=1, primary_key=True, serialize=False),
            preserve_default=False,
        ),
    ]
