"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  Database,
  Package2,
  Plus,
  Settings2,
  Trash2,
  Wrench,
} from "lucide-react";

import { useDashboardOperations } from "@/hooks/use-dashboard-operations";
import { createOperatorTimestamp, createRecordId } from "@/lib/dashboard-records";
import type { ProductRecord, ServiceRecord } from "@/types/operations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ProductDraft = {
  name: string;
  sku: string;
  category: string;
  brand: string;
  price: string;
  stock: string;
  compatibility: string;
  description: string;
  status: ProductRecord["status"];
  source: ProductRecord["source"];
};

type ServiceDraft = {
  name: string;
  category: string;
  priceStart: string;
  priceEnd: string;
  duration: string;
  description: string;
  status: ServiceRecord["status"];
  source: ServiceRecord["source"];
};

const initialProductDraft: ProductDraft = {
  name: "",
  sku: "",
  category: "Sparepart",
  brand: "",
  price: "Rp0",
  stock: "0 pcs",
  compatibility: "",
  description: "",
  status: "draft",
  source: "postgresql",
};

const initialServiceDraft: ServiceDraft = {
  name: "",
  category: "Jasa Servis",
  priceStart: "Rp0",
  priceEnd: "Rp0",
  duration: "30 menit",
  description: "",
  status: "draft",
  source: "postgresql",
};

export default function ProductsServicesPage() {
  const { data, patchData } = useDashboardOperations();
  const [activeView, setActiveView] = useState<"products" | "services">("products");
  const [selectedId, setSelectedId] = useState<string>(data.products[0]?.id ?? "");
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [productDraft, setProductDraft] = useState<ProductDraft>(initialProductDraft);
  const [serviceDraft, setServiceDraft] = useState<ServiceDraft>(initialServiceDraft);

  const selectedProduct =
    activeView === "products"
      ? data.products.find((item) => item.id === selectedId) ?? data.products[0]
      : undefined;
  const selectedService =
    activeView === "services"
      ? data.services.find((item) => item.id === selectedId) ?? data.services[0]
      : undefined;

  const stats = useMemo(
    () => [
      {
        label: "Produk aktif",
        value: `${data.products.filter((item) => item.status === "active").length}`,
        note: `${data.products.length} total produk/sparepart`,
      },
      {
        label: "Layanan aktif",
        value: `${data.services.filter((item) => item.status === "active").length}`,
        note: `${data.services.length} total layanan/paket`,
      },
      {
        label: "Stok habis",
        value: `${data.products.filter((item) => item.status === "out_of_stock").length}`,
        note: "Item pemicu fallback ke admin",
      },
      {
        label: "Source tersinkron",
        value: `${new Set([...data.products.map((item) => item.source), ...data.services.map((item) => item.source)]).size}`,
        note: "PostgreSQL & Google Sheets terhubung",
      },
    ],
    [data.products, data.services],
  );

  const updateProduct = (updates: Partial<ProductRecord>) => {
    if (!selectedProduct) {
      return;
    }

    patchData((current) => ({
      ...current,
      products: current.products.map((item) =>
        item.id === selectedProduct.id
          ? { ...item, ...updates, updatedAt: createOperatorTimestamp() }
          : item,
      ),
    }));
  };

  const updateService = (updates: Partial<ServiceRecord>) => {
    if (!selectedService) {
      return;
    }

    patchData((current) => ({
      ...current,
      services: current.services.map((item) =>
        item.id === selectedService.id
          ? { ...item, ...updates, updatedAt: createOperatorTimestamp() }
          : item,
      ),
    }));
  };

  const createProduct = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!productDraft.name.trim()) {
      return;
    }

    const nextProduct: ProductRecord = {
      id: createRecordId("prod"),
      name: productDraft.name.trim(),
      sku: productDraft.sku.trim() || createRecordId("sku").toUpperCase(),
      category: productDraft.category.trim() || "Sparepart",
      brand: productDraft.brand.trim() || "Generic",
      price: productDraft.price.trim() || "Rp0",
      stock: productDraft.stock.trim() || "0 pcs",
      compatibility: productDraft.compatibility.trim(),
      description: productDraft.description.trim(),
      status: productDraft.status,
      source: productDraft.source,
      updatedAt: createOperatorTimestamp(),
    };

    patchData((current) => ({
      ...current,
      products: [nextProduct, ...current.products],
    }));

    setActiveView("products");
    setSelectedId(nextProduct.id);
    setProductDraft(initialProductDraft);
    setIsProductModalOpen(false);
  };

  const createService = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!serviceDraft.name.trim()) {
      return;
    }

    const nextService: ServiceRecord = {
      id: createRecordId("svc"),
      name: serviceDraft.name.trim(),
      category: serviceDraft.category.trim() || "Jasa Servis",
      priceStart: serviceDraft.priceStart.trim() || "Rp0",
      priceEnd: serviceDraft.priceEnd.trim() || serviceDraft.priceStart.trim() || "Rp0",
      duration: serviceDraft.duration.trim() || "30 menit",
      description: serviceDraft.description.trim(),
      status: serviceDraft.status,
      source: serviceDraft.source,
      updatedAt: createOperatorTimestamp(),
    };

    patchData((current) => ({
      ...current,
      services: [nextService, ...current.services],
    }));

    setActiveView("services");
    setSelectedId(nextService.id);
    setServiceDraft(initialServiceDraft);
    setIsServiceModalOpen(false);
  };

  const deleteSelectedProduct = () => {
    if (!selectedProduct) {
      return;
    }

    const nextSelectedId =
      data.products.find((item) => item.id !== selectedProduct.id)?.id ?? "";

    patchData((current) => ({
      ...current,
      products: current.products.filter((item) => item.id !== selectedProduct.id),
    }));

    setSelectedId(nextSelectedId);
  };

  const deleteSelectedService = () => {
    if (!selectedService) {
      return;
    }

    const nextSelectedId =
      data.services.find((item) => item.id !== selectedService.id)?.id ?? "";

    patchData((current) => ({
      ...current,
      services: current.services.filter((item) => item.id !== selectedService.id),
    }));

    setSelectedId(nextSelectedId);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 md:p-8 bg-white border border-slate-200 shadow-2xs">
        <div className="space-y-2">
          <Badge variant="secondary">Produk & Layanan</Badge>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Katalog produk, sparepart, dan jasa sekarang menjadi data operasional inti.
          </h1>
          <p className="max-w-3xl text-xs md:text-sm leading-relaxed text-slate-600 font-medium">
            Halaman ini dipakai untuk input katalog harian agar AI, inbox, booking, dan
            automation membaca harga, stok, dan layanan dari sumber yang sama secara konsisten.
          </p>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-5 bg-white border border-slate-200 shadow-2xs space-y-2">
            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              {stat.label}
            </p>
            <p className="text-2xl font-black text-slate-900 leading-none">{stat.value}</p>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">{stat.note}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveView("products");
              setSelectedId(data.products[0]?.id ?? "");
            }}
            className={`rounded-full border px-4 py-2 text-xs font-bold transition cursor-pointer ${
              activeView === "products"
                ? "border-blue-200 bg-blue-50 text-blue-700 shadow-2xs"
                : "border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Produk & Sparepart
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveView("services");
              setSelectedId(data.services[0]?.id ?? "");
            }}
            className={`rounded-full border px-4 py-2 text-xs font-bold transition cursor-pointer ${
              activeView === "services"
                ? "border-blue-200 bg-blue-50 text-blue-700 shadow-2xs"
                : "border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            Jasa & Paket Layanan
          </button>
        </div>

        <Button
          type="button"
          variant="primary"
          size="sm"
          className="px-4"
          onClick={() =>
            activeView === "products"
              ? setIsProductModalOpen(true)
              : setIsServiceModalOpen(true)
          }
        >
          <Plus className="mr-1.5 h-4 w-4" />
          {activeView === "products" ? "Tambah produk" : "Tambah layanan"}
        </Button>
      </div>

      {activeView === "products" && !selectedProduct ? (
        <EmptyState
          icon={<Package2 className="h-10 w-10 text-blue-600" />}
          title="Belum ada produk"
          description="Tambahkan produk atau sparepart pertama agar AI, inbox, dan lookup harga membaca katalog nyata milik bisnis Anda."
          action={
            <Button
              type="button"
              variant="primary"
              className="px-4"
              onClick={() => setIsProductModalOpen(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Tambah produk
            </Button>
          }
          className="min-h-[340px]"
        />
      ) : null}

      {activeView === "services" && !selectedService ? (
        <EmptyState
          icon={<Wrench className="h-10 w-10 text-blue-600" />}
          title="Belum ada layanan"
          description="Tambahkan layanan atau paket servis pertama agar booking, AI, dan guardrail harga punya referensi operasional yang nyata."
          action={
            <Button
              type="button"
              variant="primary"
              className="px-4"
              onClick={() => setIsServiceModalOpen(true)}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Tambah layanan
            </Button>
          }
          className="min-h-[340px]"
        />
      ) : null}

      {activeView === "products" && selectedProduct ? (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] items-start">
          <Card className="p-5 md:p-6 bg-white border border-slate-200 shadow-2xs">
            <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Daftar produk</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Sumber data untuk pertanyaan harga, stok, dan kompatibilitas kendaraan.
                </p>
              </div>
              <Badge variant="secondary">{data.products.length} item</Badge>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-bold text-xs">Nama</TableHead>
                    <TableHead className="font-bold text-xs">Kategori</TableHead>
                    <TableHead className="font-bold text-xs">Harga</TableHead>
                    <TableHead className="font-bold text-xs">Stok</TableHead>
                    <TableHead className="font-bold text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.products.map((item) => (
                    <TableRow
                      key={item.id}
                      className={item.id === selectedProduct.id ? "bg-blue-50/50" : undefined}
                    >
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => setSelectedId(item.id)}
                          className="text-left font-bold text-slate-900 hover:text-blue-600 transition cursor-pointer text-xs"
                        >
                          {item.name}
                        </button>
                      </TableCell>
                      <TableCell className="text-slate-700 text-xs font-semibold">{item.category}</TableCell>
                      <TableCell className="text-slate-700 text-xs font-semibold">{item.price}</TableCell>
                      <TableCell className="text-slate-700 text-xs font-semibold">{item.stock}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === "active" ? "success" : "secondary"} className="text-[10px] font-bold uppercase">
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <Card className="p-5 md:p-6 bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-2.5 text-blue-600">
                  <Package2 className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Detail produk</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Edit cepat untuk sinkronisasi CRM, AI, dan lookup operasional.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={deleteSelectedProduct}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Hapus
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900">Nama produk</label>
                  <Input
                    value={selectedProduct.name}
                    onChange={(event) => updateProduct({ name: event.target.value })}
                    className="h-9 bg-slate-50 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900">SKU</label>
                  <Input
                    value={selectedProduct.sku}
                    onChange={(event) => updateProduct({ sku: event.target.value })}
                    className="h-9 bg-slate-50 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900">Kategori</label>
                  <Input
                    value={selectedProduct.category}
                    onChange={(event) => updateProduct({ category: event.target.value })}
                    className="h-9 bg-slate-50 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900">Brand</label>
                  <Input
                    value={selectedProduct.brand}
                    onChange={(event) => updateProduct({ brand: event.target.value })}
                    className="h-9 bg-slate-50 text-xs"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900">Harga</label>
                  <Input
                    value={selectedProduct.price}
                    onChange={(event) => updateProduct({ price: event.target.value })}
                    className="h-9 bg-slate-50 text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900">Stok</label>
                  <Input
                    value={selectedProduct.stock}
                    onChange={(event) => updateProduct({ stock: event.target.value })}
                    className="h-9 bg-slate-50 text-xs"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900">Status</label>
                  <Select
                    value={selectedProduct.status}
                    onChange={(event) =>
                      updateProduct({
                        status: event.target.value as ProductRecord["status"],
                      })
                    }
                    className="h-9 text-xs"
                  >
                    <option value="active">active</option>
                    <option value="draft">draft</option>
                    <option value="out_of_stock">out_of_stock</option>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900">Source</label>
                  <Select
                    value={selectedProduct.source}
                    onChange={(event) =>
                      updateProduct({
                        source: event.target.value as ProductRecord["source"],
                      })
                    }
                    className="h-9 text-xs"
                  >
                    <option value="postgresql">postgresql</option>
                    <option value="google_sheets">google_sheets</option>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Kompatibilitas</label>
                <Input
                  value={selectedProduct.compatibility}
                  onChange={(event) => updateProduct({ compatibility: event.target.value })}
                  className="h-9 bg-slate-50 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Deskripsi</label>
                <Textarea
                  rows={3}
                  value={selectedProduct.description}
                  onChange={(event) => updateProduct({ description: event.target.value })}
                  className="bg-slate-50 text-xs"
                />
              </div>

              <p className="text-[10px] text-slate-400 font-bold mt-2">
                Terakhir diperbarui: {selectedProduct.updatedAt}
              </p>
            </div>
          </Card>
        </div>
      ) : null}

      {activeView === "services" && selectedService ? (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr] items-start">
          <Card className="p-5 md:p-6 bg-white border border-slate-200 shadow-2xs">
            <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Daftar layanan</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Dipakai untuk jawaban harga servis, booking, dan paket layanan.
                </p>
              </div>
              <Badge variant="secondary">{data.services.length} item</Badge>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="font-bold text-xs">Nama</TableHead>
                    <TableHead className="font-bold text-xs">Kategori</TableHead>
                    <TableHead className="font-bold text-xs">Price start</TableHead>
                    <TableHead className="font-bold text-xs">Duration</TableHead>
                    <TableHead className="font-bold text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.services.map((item) => (
                    <TableRow
                      key={item.id}
                      className={item.id === selectedService.id ? "bg-blue-50/50" : undefined}
                    >
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => setSelectedId(item.id)}
                          className="text-left font-bold text-slate-900 hover:text-blue-600 transition cursor-pointer text-xs"
                        >
                          {item.name}
                        </button>
                      </TableCell>
                      <TableCell className="text-slate-700 text-xs font-semibold">{item.category}</TableCell>
                      <TableCell className="text-slate-700 text-xs font-semibold">{item.priceStart}</TableCell>
                      <TableCell className="text-slate-700 text-xs font-semibold">{item.duration}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === "active" ? "success" : "secondary"} className="text-[10px] font-bold uppercase">
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          <Card className="p-5 md:p-6 bg-white border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-2.5 text-blue-600">
                  <Wrench className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Detail layanan</h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Range harga dan durasi ini penting untuk AI guardrail.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={deleteSelectedService}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Hapus
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Nama layanan</label>
                <Input
                  value={selectedService.name}
                  onChange={(event) => updateService({ name: event.target.value })}
                  className="h-9 bg-slate-50 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Kategori</label>
                <Input
                  value={selectedService.category}
                  onChange={(event) => updateService({ category: event.target.value })}
                  className="h-9 bg-slate-50 text-xs"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900">Harga mulai</label>
                  <Input
                    value={selectedService.priceStart}
                    onChange={(event) => updateService({ priceStart: event.target.value })}
                    className="h-9 bg-slate-50 text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900">Harga akhir</label>
                  <Input
                    value={selectedService.priceEnd}
                    onChange={(event) => updateService({ priceEnd: event.target.value })}
                    className="h-9 bg-slate-50 text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900">Durasi</label>
                  <Input
                    value={selectedService.duration}
                    onChange={(event) => updateService({ duration: event.target.value })}
                    className="h-9 bg-slate-50 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900">Status</label>
                  <Select
                    value={selectedService.status}
                    onChange={(event) =>
                      updateService({
                        status: event.target.value as ServiceRecord["status"],
                      })
                    }
                    className="h-9 text-xs"
                  >
                    <option value="active">active</option>
                    <option value="draft">draft</option>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Source</label>
                <Select
                  value={selectedService.source}
                  onChange={(event) =>
                    updateService({
                      source: event.target.value as ServiceRecord["source"],
                    })
                  }
                  className="h-9 text-xs"
                >
                  <option value="postgresql">postgresql</option>
                  <option value="google_sheets">google_sheets</option>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Deskripsi</label>
                <Textarea
                  rows={3}
                  value={selectedService.description}
                  onChange={(event) => updateService({ description: event.target.value })}
                  className="bg-slate-50 text-xs"
                />
              </div>

              <p className="text-[10px] text-slate-400 font-bold mt-2">
                Terakhir diperbarui: {selectedService.updatedAt}
              </p>
            </div>
          </Card>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-5 bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Backend-ready source</h3>
          </div>
          <p className="text-xs leading-relaxed text-slate-500 font-medium">
            Struktur ini dipisah antara produk dan layanan agar mudah dipetakan
            ke tabel `products` dan `services` serta sync dari Google Sheets ke PostgreSQL.
          </p>
        </Card>

        <Card className="p-5 bg-white border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center gap-3">
            <Settings2 className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Guardrail AI</h3>
          </div>
          <p className="text-xs leading-relaxed text-slate-500 font-medium">
            Jika item tidak aktif atau stok kosong, AI tidak mengarang jawaban.
            Status di halaman ini langsung dibaca oleh automation flow.
          </p>
        </Card>
      </div>

      <Modal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setProductDraft(initialProductDraft);
        }}
        title="Tambah Produk"
        className="max-w-2xl"
      >
        <form onSubmit={createProduct} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">Nama Produk</label>
              <Input
                value={productDraft.name}
                onChange={(event) =>
                  setProductDraft((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Nama produk"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">SKU</label>
              <Input
                value={productDraft.sku}
                onChange={(event) =>
                  setProductDraft((current) => ({ ...current, sku: event.target.value }))
                }
                placeholder="SKU"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">Kategori</label>
              <Input
                value={productDraft.category}
                onChange={(event) =>
                  setProductDraft((current) => ({ ...current, category: event.target.value }))
                }
                placeholder="Kategori"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">Brand</label>
              <Input
                value={productDraft.brand}
                onChange={(event) =>
                  setProductDraft((current) => ({ ...current, brand: event.target.value }))
                }
                placeholder="Brand"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">Harga</label>
              <Input
                value={productDraft.price}
                onChange={(event) =>
                  setProductDraft((current) => ({ ...current, price: event.target.value }))
                }
                placeholder="Harga"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">Stok</label>
              <Input
                value={productDraft.stock}
                onChange={(event) =>
                  setProductDraft((current) => ({ ...current, stock: event.target.value }))
                }
                placeholder="Stok"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">Status</label>
              <Select
                value={productDraft.status}
                onChange={(event) =>
                  setProductDraft((current) => ({
                    ...current,
                    status: event.target.value as ProductRecord["status"],
                  }))
                }
              >
                <option value="active">active</option>
                <option value="draft">draft</option>
                <option value="out_of_stock">out_of_stock</option>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">Source</label>
              <Select
                value={productDraft.source}
                onChange={(event) =>
                  setProductDraft((current) => ({
                    ...current,
                    source: event.target.value as ProductRecord["source"],
                  }))
                }
              >
                <option value="postgresql">postgresql</option>
                <option value="google_sheets">google_sheets</option>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-900">Kompatibilitas</label>
            <Input
              value={productDraft.compatibility}
              onChange={(event) =>
                setProductDraft((current) => ({ ...current, compatibility: event.target.value }))
              }
              placeholder="Kecocokan motor (contoh: Vario 150, Beat)"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-900">Deskripsi</label>
            <Textarea
              rows={3}
              value={productDraft.description}
              onChange={(event) =>
                setProductDraft((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Deskripsi produk..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsProductModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary">Simpan Produk</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isServiceModalOpen}
        onClose={() => {
          setIsServiceModalOpen(false);
          setServiceDraft(initialServiceDraft);
        }}
        title="Tambah Layanan"
        className="max-w-2xl"
      >
        <form onSubmit={createService} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">Nama Layanan</label>
              <Input
                value={serviceDraft.name}
                onChange={(event) =>
                  setServiceDraft((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="Nama layanan"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">Kategori</label>
              <Input
                value={serviceDraft.category}
                onChange={(event) =>
                  setServiceDraft((current) => ({ ...current, category: event.target.value }))
                }
                placeholder="Kategori"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">Harga Mulai</label>
              <Input
                value={serviceDraft.priceStart}
                onChange={(event) =>
                  setServiceDraft((current) => ({ ...current, priceStart: event.target.value }))
                }
                placeholder="Harga mulai"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">Harga Akhir</label>
              <Input
                value={serviceDraft.priceEnd}
                onChange={(event) =>
                  setServiceDraft((current) => ({ ...current, priceEnd: event.target.value }))
                }
                placeholder="Harga akhir"
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">Durasi Servis</label>
              <Input
                value={serviceDraft.duration}
                onChange={(event) =>
                  setServiceDraft((current) => ({ ...current, duration: event.target.value }))
                }
                placeholder="Durasi"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">Status</label>
              <Select
                value={serviceDraft.status}
                onChange={(event) =>
                  setServiceDraft((current) => ({
                    ...current,
                    status: event.target.value as ServiceRecord["status"],
                  }))
                }
              >
                <option value="active">active</option>
                <option value="draft">draft</option>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-900">Source</label>
            <Select
              value={serviceDraft.source}
              onChange={(event) =>
                setServiceDraft((current) => ({
                  ...current,
                  source: event.target.value as ServiceRecord["source"],
                }))
              }
            >
              <option value="postgresql">postgresql</option>
              <option value="google_sheets">google_sheets</option>
            </Select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-900">Deskripsi</label>
            <Textarea
              rows={3}
              value={serviceDraft.description}
              onChange={(event) =>
                setServiceDraft((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Deskripsi layanan..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
            <Button type="button" variant="secondary" onClick={() => setIsServiceModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="primary">Simpan Layanan</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
