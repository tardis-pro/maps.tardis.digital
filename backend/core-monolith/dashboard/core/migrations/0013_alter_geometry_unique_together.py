# Generated by Django 4.2.2 on 2023-07-22 19:28

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0012_alter_geometry_gid'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='geometry',
            unique_together={('gid', 'source')},
        ),
    ]
