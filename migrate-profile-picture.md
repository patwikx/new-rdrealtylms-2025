# Database Migration for Profile Picture

## Run this command to add the profilePicture field to your User model:

```bash
npx prisma db push
```

Or if you prefer to create a proper migration:

```bash
npx prisma migrate dev --name add-profile-picture-field
```

## What this adds:
- `profilePicture String?` field to the User model
- This will store the MinIO filename (e.g., "profile-pictures/user-id/timestamp-random.jpg")

## After migration:
- Users can upload profile pictures
- Pictures are stored in MinIO private bucket
- Filenames are saved in the database
- Presigned URLs are generated for secure access