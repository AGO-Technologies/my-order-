from django.core.management.base import BaseCommand
from accounts.models import User, UserRole


class Command(BaseCommand):
    help = 'Seeds initial test accounts for all 4 roles in Phase 1'

    def handle(self, *args, **options):
        # 1. Superuser / Admin
        admin_email = 'admin@gmail.com'
        if not User.objects.filter(email=admin_email).exists():
            admin = User.objects.create_superuser(
                email=admin_email,
                full_name='System Administrator',
                password='AdminPassword123!',
                role=UserRole.ADMIN,
                allowed_devices=3,
            )
            self.stdout.write(self.style.SUCCESS(f'Created Admin: {admin_email} (password: AdminPassword123!)'))
        else:
            self.stdout.write(self.style.WARNING(f'Admin {admin_email} already exists.'))

        # 2. Café Owner
        owner_email = 'owner@gmail.com'
        if not User.objects.filter(email=owner_email).exists():
            owner = User.objects.create_user(
                email=owner_email,
                full_name='Dawit Owner',
                password='OwnerPassword123!',
                role=UserRole.CAFE_OWNER,
                allowed_devices=2,
            )
            self.stdout.write(self.style.SUCCESS(f'Created Café Owner: {owner_email} (password: OwnerPassword123!)'))
        else:
            self.stdout.write(self.style.WARNING(f'Café Owner {owner_email} already exists.'))

        # 3. Café Worker
        worker_email = 'worker@gmail.com'
        if not User.objects.filter(email=worker_email).exists():
            worker = User.objects.create_user(
                email=worker_email,
                full_name='Hanna Worker',
                password='WorkerPassword123!',
                role=UserRole.CAFE_WORKER,
                allowed_devices=2,
            )
            self.stdout.write(self.style.SUCCESS(f'Created Café Worker: {worker_email} (password: WorkerPassword123!)'))
        else:
            self.stdout.write(self.style.WARNING(f'Café Worker {worker_email} already exists.'))

        # 4. Customer
        customer_email = 'customer@gmail.com'
        if not User.objects.filter(email=customer_email).exists():
            customer = User.objects.create_user(
                email=customer_email,
                full_name='Amir Kebede',
                password='CustomerPassword123!',
                role=UserRole.CUSTOMER,
                student_id='RU1122/19',
                phone_number='0911223344',
                fan='1029384756',
                zone=1,
                block='12',
                room='04',
                allowed_devices=1,
            )
            self.stdout.write(self.style.SUCCESS(f'Created Customer: {customer_email} (password: CustomerPassword123!)'))
        else:
            self.stdout.write(self.style.WARNING(f'Customer {customer_email} already exists.'))
