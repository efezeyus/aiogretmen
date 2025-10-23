"""
GraphQL Route Configuration
--------------------------
GraphQL endpoint configuration.
"""

from strawberry.fastapi import GraphQLRouter
from fastapi import Depends, Request
from typing import Optional

from app.graphql.schema import schema
from app.core.logger import logger


# Context getter for authentication
async def get_context(request: Request) -> dict:
    """GraphQL context with auth info"""
    # Token'dan user_id al (basitleştirilmiş)
    auth_header = request.headers.get("Authorization", "")
    user_id = None
    
    if auth_header.startswith("Bearer "):
        # JWT decode edilecek
        user_id = "demo_user"  # Örnek
    
    return {
        "request": request,
        "user_id": user_id,
        "is_authenticated": user_id is not None
    }


# GraphQL Router
graphql_app = GraphQLRouter(
    schema,
    path="/",
    context_getter=get_context,
    graphiql=True  # GraphQL Playground
)


# WebSocket support for subscriptions
@graphql_app.websocket_route("/ws")
async def graphql_ws(websocket):
    """GraphQL WebSocket endpoint for subscriptions"""
    await graphql_app.handle_websocket(websocket)
