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
        note: "Item yang sebaiknya memicu fallback ke admin",
      },
      {
        label: "Source tersinkron",
        value: `${new Set([...data.products.map((item) => item.source), ...data.services.map((item) => item.source)]).size}`,
        note: "PostgreSQL dan Google Sheets siap dijadikan source of truth",
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
      <div className="rounded-2xl border border-white/8 bg-gradient-to-r from-white/[0.04] to-transparent p-6 md:p-8">
        <Badge>Produk & Layanan</Badge>
        <h1 className="mt-3 text-3xl font-bold text-white">
          Katalog produk, sparepart, dan jasa sekarang menjadi data operasional inti.
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
          Halaman ini dipakai untuk input katalog harian agar AI, inbox, booking, dan
          automation membaca harga, stok, dan layanan dari sumber yang sama.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="glass-panel p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {stat.label}
            </p>
            <p className="mt-3 text-3xl font-bold text-white">{stat.value}</p>
            <p className="mt-4 text-xs leading-6 text-slate-400">{stat.note}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            setActiveView("products");
            setSelectedId(data.products[0]?.id ?? "");
          }}
          className={`rounded-full border px-4 py-2 text-xs font-semibold ${
            activeView === "products"
              ? "border-cyan-400/20 bg-cyan-950/30 text-cyan-300"
              : "border-white/10 bg-white/5 text-slate-300"
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
          className={`rounded-full border px-4 py-2 text-xs font-semibold ${
            activeView === "services"
              ? "border-cyan-400/20 bg-cyan-950/30 text-cyan-300"
              : "border-white/10 bg-white/5 text-slate-300"
          }`}
        >
          Jasa & Paket Layanan
        </button>

        <Button
          type="button"
          variant="secondary"
          className="rounded-full px-4 py-2 text-xs"
          onClick={() =>
            activeView === "products"
              ? setIsProductModalOpen(true)
              : setIsServiceModalOpen(true)
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          {activeView === "products" ? "Tambah produk" : "Tambah layanan"}
        </Button>
      </div>

      {activeView === "products" && selectedProduct ? (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="glass-panel p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Daftar produk</h2>
                <p className="text-xs text-slate-400">
                  Sumber data untuk pertanyaan harga, stok, dan kompatibilitas motor.
                </p>
              </div>
              <Badge>{data.products.length} item</Badge>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>Stok</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.products.map((item) => (
                  <TableRow
                    key={item.id}
                    className={item.id === selectedProduct.id ? "bg-white/[0.04]" : undefined}
                  >
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        className="text-left text-white"
                      >
                        {item.name}
                      </button>
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.price}</TableCell>
                    <TableCell>{item.stock}</TableCell>
                    <TableCell>{item.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Card className="glass-panel p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-white/8 bg-white/5 p-3 text-cyan-300">
                  <Package2 className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Detail produk</h2>
                  <p className="text-xs text-slate-400">
                    Edit cepat untuk sinkronisasi CRM, AI, dan lookup operasional.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="secondary"
                className="rounded-xl border-rose-500/20 bg-rose-950/20 px-4 text-rose-200 hover:border-rose-400/30 hover:bg-rose-950/30"
                onClick={deleteSelectedProduct}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus
              </Button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Nama produk</label>
                  <Input
                    value={selectedProduct.name}
                    onChange={(event) => updateProduct({ name: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">SKU</label>
                  <Input
                    value={selectedProduct.sku}
                    onChange={(event) => updateProduct({ sku: event.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Kategori</label>
                  <Input
                    value={selectedProduct.category}
                    onChange={(event) => updateProduct({ category: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Brand</label>
                  <Input
                    value={selectedProduct.brand}
                    onChange={(event) => updateProduct({ brand: event.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Harga</label>
                  <Input
                    value={selectedProduct.price}
                    onChange={(event) => updateProduct({ price: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Stok</label>
                  <Input
                    value={selectedProduct.stock}
                    onChange={(event) => updateProduct({ stock: event.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Status</label>
                  <Select
                    value={selectedProduct.status}
                    onChange={(event) =>
                      updateProduct({
                        status: event.target.value as ProductRecord["status"],
                      })
                    }
                  >
                    <option value="active">active</option>
                    <option value="draft">draft</option>
                    <option value="out_of_stock">out_of_stock</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Source</label>
                  <Select
                    value={selectedProduct.source}
                    onChange={(event) =>
                      updateProduct({
                        source: event.target.value as ProductRecord["source"],
                      })
                    }
                  >
                    <option value="postgresql">postgresql</option>
                    <option value="google_sheets">google_sheets</option>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Kompatibilitas</label>
                <Input
                  value={selectedProduct.compatibility}
                  onChange={(event) => updateProduct({ compatibility: event.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Deskripsi</label>
                <Textarea
                  rows={4}
                  value={selectedProduct.description}
                  onChange={(event) => updateProduct({ description: event.target.value })}
                />
              </div>

              <p className="text-[11px] text-slate-500">
                Terakhir diperbarui: {selectedProduct.updatedAt}
              </p>
            </div>
          </Card>
        </div>
      ) : null}

      {activeView === "services" && selectedService ? (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="glass-panel p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Daftar layanan</h2>
                <p className="text-xs text-slate-400">
                  Dipakai untuk jawaban harga servis, booking, dan paket layanan.
                </p>
              </div>
              <Badge>{data.services.length} item</Badge>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Price start</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.services.map((item) => (
                  <TableRow
                    key={item.id}
                    className={item.id === selectedService.id ? "bg-white/[0.04]" : undefined}
                  >
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => setSelectedId(item.id)}
                        className="text-left text-white"
                      >
                        {item.name}
                      </button>
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{item.priceStart}</TableCell>
                    <TableCell>{item.duration}</TableCell>
                    <TableCell>{item.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <Card className="glass-panel p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl border border-white/8 bg-white/5 p-3 text-cyan-300">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Detail layanan</h2>
                  <p className="text-xs text-slate-400">
                    Range harga dan durasi ini akan penting untuk AI guardrail.
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="secondary"
                className="rounded-xl border-rose-500/20 bg-rose-950/20 px-4 text-rose-200 hover:border-rose-400/30 hover:bg-rose-950/30"
                onClick={deleteSelectedService}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus
              </Button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Nama layanan</label>
                <Input
                  value={selectedService.name}
                  onChange={(event) => updateService({ name: event.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Kategori</label>
                <Input
                  value={selectedService.category}
                  onChange={(event) => updateService({ category: event.target.value })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Harga mulai</label>
                  <Input
                    value={selectedService.priceStart}
                    onChange={(event) => updateService({ priceStart: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Harga akhir</label>
                  <Input
                    value={selectedService.priceEnd}
                    onChange={(event) => updateService({ priceEnd: event.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Durasi</label>
                  <Input
                    value={selectedService.duration}
                    onChange={(event) => updateService({ duration: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">Status</label>
                  <Select
                    value={selectedService.status}
                    onChange={(event) =>
                      updateService({
                        status: event.target.value as ServiceRecord["status"],
                      })
                    }
                  >
                    <option value="active">active</option>
                    <option value="draft">draft</option>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Source</label>
                <Select
                  value={selectedService.source}
                  onChange={(event) =>
                    updateService({
                      source: event.target.value as ServiceRecord["source"],
                    })
                  }
                >
                  <option value="postgresql">postgresql</option>
                  <option value="google_sheets">google_sheets</option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Deskripsi</label>
                <Textarea
                  rows={4}
                  value={selectedService.description}
                  onChange={(event) => updateService({ description: event.target.value })}
                />
              </div>

              <p className="text-[11px] text-slate-500">
                Terakhir diperbarui: {selectedService.updatedAt}
              </p>
            </div>
          </Card>
        </div>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-panel p-5">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-cyan-300" />
            <h3 className="text-base font-semibold text-white">Backend-ready source</h3>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Struktur ini sengaja dipisah antara produk dan layanan agar nanti mudah dipetakan
            ke tabel `products` dan `services`, termasuk sync dari Google Sheets ke PostgreSQL.
          </p>
        </Card>

        <Card className="glass-panel p-5">
          <div className="flex items-center gap-3">
            <Settings2 className="h-5 w-5 text-cyan-300" />
            <h3 className="text-base font-semibold text-white">Guardrail AI</h3>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Jika item tidak aktif atau stok kosong, AI seharusnya tidak mengarang jawaban.
            Status di halaman ini nanti bisa langsung dibaca oleh automation flow.
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
            <Input
              value={productDraft.name}
              onChange={(event) =>
                setProductDraft((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Nama produk"
              required
            />
            <Input
              value={productDraft.sku}
              onChange={(event) =>
                setProductDraft((current) => ({ ...current, sku: event.target.value }))
              }
              placeholder="SKU"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              value={productDraft.category}
              onChange={(event) =>
                setProductDraft((current) => ({ ...current, category: event.target.value }))
              }
              placeholder="Kategori"
            />
            <Input
              value={productDraft.brand}
              onChange={(event) =>
                setProductDraft((current) => ({ ...current, brand: event.target.value }))
              }
              placeholder="Brand"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              value={productDraft.price}
              onChange={(event) =>
                setProductDraft((current) => ({ ...current, price: event.target.value }))
              }
              placeholder="Harga"
            />
            <Input
              value={productDraft.stock}
              onChange={(event) =>
                setProductDraft((current) => ({ ...current, stock: event.target.value }))
              }
              placeholder="Stok"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
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
          <Input
            value={productDraft.compatibility}
            onChange={(event) =>
              setProductDraft((current) => ({ ...current, compatibility: event.target.value }))
            }
            placeholder="Kompatibilitas"
          />
          <Textarea
            rows={4}
            value={productDraft.description}
            onChange={(event) =>
              setProductDraft((current) => ({ ...current, description: event.target.value }))
            }
            placeholder="Deskripsi produk"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsProductModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit">Simpan produk</Button>
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
            <Input
              value={serviceDraft.name}
              onChange={(event) =>
                setServiceDraft((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Nama layanan"
              required
            />
            <Input
              value={serviceDraft.category}
              onChange={(event) =>
                setServiceDraft((current) => ({ ...current, category: event.target.value }))
              }
              placeholder="Kategori"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              value={serviceDraft.priceStart}
              onChange={(event) =>
                setServiceDraft((current) => ({ ...current, priceStart: event.target.value }))
              }
              placeholder="Harga mulai"
            />
            <Input
              value={serviceDraft.priceEnd}
              onChange={(event) =>
                setServiceDraft((current) => ({ ...current, priceEnd: event.target.value }))
              }
              placeholder="Harga akhir"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              value={serviceDraft.duration}
              onChange={(event) =>
                setServiceDraft((current) => ({ ...current, duration: event.target.value }))
              }
              placeholder="Durasi"
            />
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
          <Textarea
            rows={4}
            value={serviceDraft.description}
            onChange={(event) =>
              setServiceDraft((current) => ({ ...current, description: event.target.value }))
            }
            placeholder="Deskripsi layanan"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsServiceModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit">Simpan layanan</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
