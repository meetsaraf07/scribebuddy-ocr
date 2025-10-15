const API = import.meta.env.VITE_OCR_API as string;

function base() {
  if (!API) throw new Error("VITE_OCR_API not set");
  return API.replace(/\/$/, "");
}

async function postJSON(url: string, init: RequestInit) {
  const res = await fetch(url, init);
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch {}
  if (!res.ok) throw new Error(data?.detail || data?.error || text || `HTTP ${res.status}`);
  if (!data) throw new Error("Empty JSON from server");
  return data;
}

export type OcrBox = { x:number; y:number; w:number; h:number; word:string; conf?:number };
export type OcrResp = { text:string; avg_conf?:number; boxes?:OcrBox[]; raw?:any };

export async function runOCRFile(file: File | Blob, language="eng", overlay=false): Promise<OcrResp> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("language", language);
  fd.append("overlay", String(overlay));
  return postJSON(`${base()}/ocr/handwriting`, { method: "POST", body: fd });
}

export async function runOCRUrl(url: string, language="eng", overlay=false): Promise<OcrResp> {
  const fd = new FormData();
  fd.append("url", url);
  fd.append("language", language);
  fd.append("overlay", String(overlay));
  return postJSON(`${base()}/ocr/handwriting`, { method: "POST", body: fd });
}
