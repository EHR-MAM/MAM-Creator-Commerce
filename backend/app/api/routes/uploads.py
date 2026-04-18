"""
Sprint XXXII: Product image upload
POST /uploads/image  — authenticated (vendor/admin/operator)
Accepts: multipart/form-data, field: file (image/*)
Returns: { url: "https://sensedirector.com/mam-uploads/<uuid>.<ext>" }
Stores: /var/www/mam-uploads/<uuid>.<ext>
"""
import uuid
import os
import shutil
import aiofiles
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.core.deps import get_current_user
from app.models.user import User

router = APIRouter(prefix="/uploads", tags=["uploads"])

UPLOAD_DIR = "/var/www/mam-uploads"
MAX_SIZE_BYTES = 8 * 1024 * 1024  # 8 MB
ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}

# Public base URL for uploads — matches nginx location /mam-uploads/
PUBLIC_BASE = os.getenv("UPLOAD_PUBLIC_BASE", "https://sensedirector.com/mam-uploads")


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
):
    """Upload a product image. Returns the public URL to store in product.media_urls."""
    # Auth: any logged-in user (vendor, influencer, admin)
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Validate content type
    content_type = file.content_type or ""
    if content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Accepted: jpeg, png, webp, gif",
        )

    # Derive extension
    original_name = file.filename or "upload"
    _, ext = os.path.splitext(original_name.lower())
    if ext not in ALLOWED_EXTS:
        ext = ".jpg"  # fallback

    # Generate unique filename
    filename = f"{uuid.uuid4().hex}{ext}"
    dest_path = os.path.join(UPLOAD_DIR, filename)

    # Save file, enforce max size
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    total_size = 0
    try:
        async with aiofiles.open(dest_path, "wb") as out:
            while chunk := await file.read(64 * 1024):  # 64KB chunks
                total_size += len(chunk)
                if total_size > MAX_SIZE_BYTES:
                    await out.close()
                    os.remove(dest_path)
                    raise HTTPException(
                        status_code=413,
                        detail="File too large. Maximum size is 8 MB.",
                    )
                await out.write(chunk)
    except HTTPException:
        raise
    except Exception as e:
        if os.path.exists(dest_path):
            os.remove(dest_path)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

    public_url = f"{PUBLIC_BASE}/{filename}"
    return {"url": public_url, "filename": filename, "size": total_size}
