import api from "@/api/axios";
import { createSlug } from "@/utils/createSlug";

const FALLBACK_THUMBNAIL =
  "https://images.unsplash.com/photo-1507514604110-ba3347c457f6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

function unwrap(res) {
  const body = res.data;
  if (body && typeof body === "object" && "success" in body) {
    if (!body.success) throw new Error(body.message || "Request failed");
    return body.data;
  }
  return body;
}

function toViewModel(item) {
  if (!item) return null;

  return {
    id: String(item.id || item._id || ""),
    slug: item.slug || createSlug(item.title || ""),
    title: item.title || "",
    shortDescription: item.shortDescription || item.summary || "",
    summary: item.summary || item.shortDescription || "",
    content: item.content || "",
    thumbnail: item.thumbnail || item.imageUrl || FALLBACK_THUMBNAIL,
    imageUrl: item.imageUrl || item.thumbnail || FALLBACK_THUMBNAIL,
    category: item.category || "Tin tức",
    author: item.author || item.createdBy || "Ban quản trị",
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    featured: Boolean(item.featured),
    status: item.status || "published",
  };
}

function mapList(data) {
  const list = Array.isArray(data) ? data : [];
  return list.map(toViewModel);
}

async function fileToDataUrl(file) {
  if (!file) return "";

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("Không thể đọc file ảnh"));
    reader.readAsDataURL(file);
  });
}

export const newsApi = {
  async getAllNews(params = {}) {
    const data = await api.get("/news", { params }).then(unwrap);
    return { data: mapList(data) };
  },

  async getNewsById(id) {
    const data = await api.get(`/news/${id}`).then(unwrap);
    return { data: toViewModel(data) };
  },

  async getFeaturedNews(limit = 3) {
    const data = await api
      .get("/news/featured", { params: { limit } })
      .then(unwrap);
    return { data: mapList(data) };
  },

  async getRelatedNews(newsId, limit = 3) {
    const data = await api
      .get(`/news/${newsId}/related`, { params: { limit } })
      .then(unwrap);
    return { data: mapList(data) };
  },

  async getAdminNewsById(id) {
    return this.getNewsById(id);
  },

  async createNews(payload, imageFile) {
    try {
      const imageData = imageFile ? await fileToDataUrl(imageFile) : "";
      const body = {
        title: payload.title,
        summary: payload.summary ?? payload.shortDescription ?? "",
        content: payload.content,
        category: payload.category,
        featured: Boolean(payload.featured),
        thumbnail:
          imageData ||
          payload.thumbnail ||
          payload.imageUrl ||
          FALLBACK_THUMBNAIL,
        status: payload.status || "published",
      };

      const data = await api.post("/news", body).then(unwrap);
      return { data: toViewModel(data) };
    } catch (error) {
      if (error?.response?.status === 413) {
        throw new Error("Ảnh quá lớn, vui lòng chọn ảnh nhỏ hơn.");
      }
      throw error;
    }
  },

  async updateNews(id, payload, imageFile) {
    try {
      const imageData = imageFile ? await fileToDataUrl(imageFile) : "";
      const body = {
        title: payload.title,
        summary: payload.summary ?? payload.shortDescription ?? "",
        content: payload.content,
        category: payload.category,
        featured: Boolean(payload.featured),
        ...(imageData ? { thumbnail: imageData } : {}),
        ...(payload.status ? { status: payload.status } : {}),
      };

      const data = await api.patch(`/news/${id}`, body).then(unwrap);
      return { data: toViewModel(data) };
    } catch (error) {
      if (error?.response?.status === 413) {
        throw new Error("Ảnh quá lớn, vui lòng chọn ảnh nhỏ hơn.");
      }
      throw error;
    }
  },

  async deleteNews(id) {
    await api.delete(`/news/${id}`);
  },
};
