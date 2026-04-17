from fastapi import APIRouter, Depends, HTTPException
from qdrant_client.http.exceptions import UnexpectedResponse
import aiosqlite

from models.schemas import CollectionCreate, CollectionInfo, CollectionMetaUpdate, CollectionStats, DeleteResponse
from services import qdrant as qdrant_svc
from services.database import delete_meta, get_all_meta, get_db, get_system_prompt, upsert_meta

router = APIRouter()


@router.get("/collections", response_model=list[CollectionInfo])
async def list_collections(db: aiosqlite.Connection = Depends(get_db)):
    collections = await qdrant_svc.list_collections()
    meta_map = await get_all_meta(db)
    for col in collections:
        col.system_prompt = meta_map.get(col.name, "")
    return collections


@router.post("/collections", response_model=CollectionInfo, status_code=201)
async def create_collection(
    body: CollectionCreate,
    db: aiosqlite.Connection = Depends(get_db),
):
    try:
        await qdrant_svc.create_collection(body.name)
    except UnexpectedResponse as e:
        if e.status_code == 409:
            raise HTTPException(status_code=409, detail=f"Collection '{body.name}' already exists")
        raise
    await upsert_meta(db, body.name, body.system_prompt)
    return CollectionInfo(name=body.name, vectors_count=0, points_count=0, system_prompt=body.system_prompt)


@router.patch("/collections/{name}/meta", response_model=CollectionInfo)
async def update_collection_meta(
    name: str,
    body: CollectionMetaUpdate,
    db: aiosqlite.Connection = Depends(get_db),
):
    await upsert_meta(db, name, body.system_prompt)
    collections = await qdrant_svc.list_collections()
    col = next((c for c in collections if c.name == name), None)
    if col is None:
        raise HTTPException(status_code=404, detail=f"Collection '{name}' not found")
    col.system_prompt = body.system_prompt
    return col


@router.delete("/collections/{name}", response_model=DeleteResponse)
async def delete_collection(
    name: str,
    db: aiosqlite.Connection = Depends(get_db),
):
    await qdrant_svc.delete_collection(name)
    await delete_meta(db, name)
    return DeleteResponse(deleted=1)


@router.get("/collections/{name}/stats", response_model=CollectionStats)
async def get_stats(name: str):
    return await qdrant_svc.get_collection_stats(name)
