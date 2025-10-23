"""
Yapay Zeka Öğretmen - Ödeme Rotaları
-----------------------------------
Ödeme işlemleri için API rotaları.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query, Path, Request
from typing import List, Optional

from app.api.controllers import payment_controller
from app.api.middlewares.auth import get_current_user, check_role
from app.api.schemas.auth import RoleEnum
from app.models.user import User

router = APIRouter()

@router.get("/plans")
async def get_subscription_plans():
    """
    Abonelik planlarını getir.
    """
    return await payment_controller.get_subscription_plans()


@router.post("/create-checkout", status_code=status.HTTP_200_OK)
async def create_checkout_session(
    checkout_data: dict,
    current_user: User = Depends(get_current_user),
):
    """
    Ödeme sayfası oluştur.
    """
    if "plan_id" not in checkout_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Plan ID gereklidir",
        )
    
    return await payment_controller.create_checkout_session(current_user.id, checkout_data["plan_id"])


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def stripe_webhook(request: Request):
    """
    Stripe webhook.
    """
    payload = await request.body()
    sig_header = request.headers.get("Stripe-Signature")
    
    return await payment_controller.process_webhook(payload, sig_header)


@router.get("/history")
async def get_payment_history(
    current_user: User = Depends(get_current_user),
):
    """
    Kullanıcının ödeme geçmişini getir.
    """
    return await payment_controller.get_payment_history(current_user.id)


@router.post("/cancel", status_code=status.HTTP_200_OK)
async def cancel_subscription(
    current_user: User = Depends(get_current_user),
):
    """
    Aboneliği iptal et.
    """
    return await payment_controller.cancel_subscription(current_user.id)


@router.get("/admin/subscriptions")
async def get_all_subscriptions(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    status: Optional[str] = None,
    current_user: User = Depends(check_role([RoleEnum.ADMIN])),
):
    """
    Tüm abonelikleri getir.
    Sadece yöneticiler erişebilir.
    """
    return await payment_controller.get_all_subscriptions(skip, limit, status) 