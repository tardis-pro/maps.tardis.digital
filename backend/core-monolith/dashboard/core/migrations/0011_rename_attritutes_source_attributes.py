# Generated by Django 4.1.7 on 2023-05-23 21:57

from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0010_alter_source_sid"),
    ]

    operations = [
        migrations.RenameField(
            model_name="source",
            old_name="attritutes",
            new_name="attributes",
        ),
    ]