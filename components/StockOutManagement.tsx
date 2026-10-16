import React, { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { StockOutRequest, StockOutManual, RequestedDrug } from "../types";
import { useProducts } from "../hooks/useProducts";
import {
  useStockOutRequests,
  useStockOutRealtime,
  useCreateStockOutRequest,
  useProcessStockOutRequest,
  useUpdateStockOutRequest,
} from "../hooks/useStockOut";
import { useServices } from "../hooks/useServices";
import StockOutManualForm from "./StockOutManualForm";
import StockOutRequestForm from "./StockOutRequestForm";
import PaginationControls from "./PaginationControls";
import { Button } from "./ui/button";
import { DataTable } from "./ui/data-table";
import { createStockOutColumns } from "./StockOutColumns";
import { useToast } from "./ui/toast";
import { withErrorDetail } from "../lib/utils";
import { exportStockOutToExcel } from "../lib/exportUtils";
import { calculateRequestTotals } from "../lib/stockOutTotals";

import { useAuth } from "@/hooks/useAuth"

const StockOutManagement: React.FC = () => {
  const { showToast } = useToast();
  // Queries
  const { data: productData } = useProducts({ page: 1, perPage: 1000 });
  const products = productData?.data || [];

  const { data: serviceData } = useServices({ page: 1, perPage: 1000 });
  const services = serviceData?.data || [];

  // Pagination State for Requests
  const perPage = 10;
  const [filterStatus, setFilterStatus] = useState<string>("Semua");
  const hasInitializedQueueFilter = useRef(false);

  // Permission Logic — hoisted up so we can use in query params
  const { userProfile } = useAuth();
  const userId = userProfile?.id;
  const userRoles = userProfile?.roles ?? (userProfile?.role ? [userProfile.role] : []);
  const isAdmin = userRoles.includes('admin');
  const isFarmasi = userRoles.includes('apoteker') || userRoles.includes('farmasi');
  const isNakes = userRoles.includes('nakes');

  const {
    data: paginatedRequests,
    isLoading: isRequestsLoading,
  } = useStockOutRequests({
    page: 1,
    perPage: 1000,
    status: filterStatus === "Semua" ? undefined : filterStatus,
    createdBy: isNakes && userId ? userId : undefined,
    nakesName: isNakes && userProfile?.full_name ? userProfile.full_name : undefined,
  });
  const requests = paginatedRequests?.data || [];
  const totalRequests = paginatedRequests?.total || 0;

  // Realtime subscription — refresh tabel otomatis saat ada transaksi baru
  useStockOutRealtime();

  // Mutations
  const createTransaction = useCreateStockOutRequest();
  const processTransaction = useProcessStockOutRequest();
  const updateRequestMutation = useUpdateStockOutRequest();

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isRequestFormOpen, setIsRequestFormOpen] = useState(false);

  // Detail Modal State
  const [selectedRequest, setSelectedRequest] =
    useState<StockOutRequest | null>(null);
  const [isProcessMode, setIsProcessMode] = useState(false); // New state for distinct modes
  const [processDiscount, setProcessDiscount] = useState<number>(0);
  const [processServiceFee, setProcessServiceFee] = useState<number>(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editableRequest, setEditableRequest] =
    useState<StockOutRequest | null>(null);

  // Confirmation Dialog State
  const [requestToProcess, setRequestToProcess] =
    useState<StockOutRequest | null>(null);

  // Timeline Real Data
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [showTimeline, setShowTimeline] = useState(true);

  const fetchTimeline = async () => {
    try {
      const data = await api.getRecentStockOuts(10);
      setTimelineData(data);
    } catch (err) {
      console.error("Failed to fetch timeline", err);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, []);

  const refreshTimeline = () => fetchTimeline();

  useEffect(() => {
    if (!selectedRequest) {
      setEditableRequest(null);
      setIsEditMode(false);
      return;
    }

    setEditableRequest({
      ...selectedRequest,
      patient: { ...selectedRequest.patient },
      drugs: selectedRequest.drugs.map((drug) => ({ ...drug })),
      services: selectedRequest.services.map((service) => ({ ...service })),
    });
    setIsEditMode(false);
  }, [selectedRequest]);

  const canCreateRequest = isAdmin || isNakes;
  const canManualStock = isAdmin || isFarmasi;
  const canProcessRequest = isAdmin || isFarmasi;
  const canEditRequest = (request: StockOutRequest) =>
    request.status === "Menunggu" &&
    (isAdmin || isFarmasi || (isNakes && request.createdBy === userId));

  useEffect(() => {
    if (hasInitializedQueueFilter.current || !userProfile) return;

    setFilterStatus(isAdmin || isFarmasi ? "Menunggu" : "Semua");
    hasInitializedQueueFilter.current = true;
  }, [isAdmin, isFarmasi, userProfile]);

  const filteredRequests = requests;

  const handleSaveManualRecord = async (record: StockOutManual) => {
    try {
      const totalAmount = record.items.reduce((sum, item) => {
        const product = products.find((p) => p.id === item.productId);
        return sum + (product ? product.sellingPrice : 0) * item.quantity;
      }, 0);

      const transactionNumber = await api.generateTransactionNumber("keluar");

      await createTransaction.mutateAsync({
        nomor: transactionNumber,
        tanggal: record.date,
        tipe: "keluar",
        tipe_sumber: "KASIR_LANGSUNG",
        status: "selesai",
        nama_pasien: record.patient.fullName,
        tanggal_lahir_pasien: record.patient.birthDate,
        keterangan: record.reason,
        total: totalAmount,
        items: record.items.map((item) => {
          const product = products.find((p) => p.id === item.productId);
          return {
            productId: item.productId,
            quantity: item.quantity,
            price: product ? product.sellingPrice : 0,
          };
        }),
        services: [],
        requestedBy: isAdmin ? "Admin" : "Farmasi",
      });

      // Refresh timeline after manual add
      fetchTimeline();
      setIsManualModalOpen(false);

      const itemCount = record.items.length;
      const itemSummary =
        itemCount === 1
          ? record.items[0].productName
          : `${record.items[0].productName} dan ${itemCount - 1} item lainnya`;

      showToast(
        `Stok keluar untuk ${record.patient.fullName} berhasil dicatat: ${itemSummary}`,
        'success',
      );
    } catch (error) {
      console.error("Error saving manual record:", error);
      showToast(withErrorDetail("Gagal menyimpan transaksi manual", error), 'error');
    }
  };

  const handleSaveRequest = async (request: StockOutRequest) => {
    try {
      const transactionNumber = await api.generateTransactionNumber("keluar");

      await createTransaction.mutateAsync({
        nomor: transactionNumber,
        tanggal: request.date,
        tipe: "keluar",
        tipe_sumber: request.tipeSumber,
        status: "diajukan",
        nama_pasien: request.patient.fullName,
        tanggal_lahir_pasien: request.patient.birthDate,
        keterangan: `Request from Nakes - Original ID: ${request.requestId}`,
        total: request.totalAmount,
        diskon: request.discount ?? 0,
        serviceFee: request.serviceFee ?? 0,
        items: request.drugs.map((drug) => {
          const product = products.find((p) => p.id === drug.productId);
          return {
            productId: drug.productId,
            quantity: drug.quantity,
            price: product ? product.sellingPrice : 0,
          };
        }),
        services: request.services.map((svc) => ({
          // Now handles RequestedService[]
          serviceId: svc.id,
          price: svc.price,
        })),
        requestedBy: request.requestedBy,
      });

      setIsRequestFormOpen(false);
      showToast(
        `Pengajuan stok keluar untuk ${request.patient.fullName} berhasil disimpan.`,
        'success',
      );
    } catch (error) {
      console.error("Error saving request:", error);
      showToast(withErrorDetail("Gagal menyimpan pengajuan", error), 'error');
    }
  };

  const processRequest = async () => {
    if (!requestToProcess || processTransaction.isPending) return;

    try {
      const subtot = getDetailTotals(requestToProcess).totalDrugs + getDetailTotals(requestToProcess).totalServices;
      await processTransaction.mutateAsync({
        number: requestToProcess.id,
        status: "selesai",
        diskon: processDiscount,
        serviceFee: processServiceFee,
        total: Math.max(0, subtot + processServiceFee - processDiscount)
      });
      showToast(
        "Permintaan berhasil diproses. Stok telah dikurangi secara otomatis.",
        'success',
      );
      refreshTimeline(); // Update history
      setRequestToProcess(null); // Close modal
    } catch (error) {
      console.error("Error processing request:", error);
      showToast(withErrorDetail("Gagal memproses permintaan", error), 'error');
    }
  };

  const getRequestTotals = (req: StockOutRequest, discountOverride?: number) =>
    calculateRequestTotals(req, {
      discount: discountOverride,
      serviceFee: isProcessMode ? processServiceFee : undefined,
    });

  // Helper to calculate totals for display in Detail Modal
  const getDetailTotals = (req: StockOutRequest) => {
    return getRequestTotals(req, isProcessMode ? processDiscount : undefined);
  };

  const handleEditDrugChange = (
    drugId: string,
    field: "productId" | "quantity",
    value: string | number,
  ) => {
    setEditableRequest((prev) => {
      if (!prev) return prev;

      return {
        ...prev,
        drugs: prev.drugs.map((drug) => {
          if (drug.id !== drugId) return drug;

          if (field === "productId") {
            const product = products.find((item) => item.id === value);
            return {
              ...drug,
              productId: String(value),
              productName: product?.name || "",
              unit: product?.unit || drug.unit,
              price: product?.sellingPrice || 0,
            };
          }

          return {
            ...drug,
            quantity: Math.max(1, Number(value) || 1),
          };
        }),
      };
    });
  };

  const addEditableDrug = () => {
    const fallbackProduct = products[0];
    if (!fallbackProduct) return;

    setEditableRequest((prev) => {
      if (!prev) return prev;

      const newDrug: RequestedDrug = {
        id: `tmp-${Date.now()}`,
        productId: fallbackProduct.id,
        productName: fallbackProduct.name,
        quantity: 1,
        unit: fallbackProduct.unit,
        instructions: "-",
        price: fallbackProduct.sellingPrice,
      };

      return {
        ...prev,
        drugs: [...prev.drugs, newDrug],
      };
    });
  };

  const removeEditableDrug = (drugId: string) => {
    setEditableRequest((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        drugs: prev.drugs.filter((drug) => drug.id !== drugId),
      };
    });
  };

  const toggleEditableService = (serviceId: string) => {
    setEditableRequest((prev) => {
      if (!prev) return prev;

      const existing = prev.services.find((service) => service.id === serviceId);
      if (existing) {
        return {
          ...prev,
          services: prev.services.filter((service) => service.id !== serviceId),
        };
      }

      const service = services.find((item) => item.id === serviceId);
      if (!service) return prev;

      return {
        ...prev,
        services: [
          ...prev.services,
          {
            id: service.id,
            name: service.name,
            price: service.price,
          },
        ],
      };
    });
  };

  const handleSaveDetailEdit = async () => {
    if (!selectedRequest || !editableRequest || updateRequestMutation.isPending) return;

    const hasInvalidDrug = editableRequest.drugs.some(
      (drug) => !drug.productId || drug.quantity <= 0,
    );
    const hasContent = editableRequest.drugs.length > 0 || editableRequest.services.length > 0;

    if (!editableRequest.patient.fullName.trim()) {
      showToast("Nama pasien wajib diisi.", "error");
      return;
    }
    if (!hasContent) {
      showToast("Tambahkan minimal satu obat atau satu jasa.", "error");
      return;
    }
    if (hasInvalidDrug) {
      showToast("Pastikan semua item obat sudah dipilih dan jumlahnya valid.", "error");
      return;
    }

    try {
      const totals = getRequestTotals(editableRequest);

      await updateRequestMutation.mutateAsync({
        number: selectedRequest.id,
        payload: {
          tanggal: editableRequest.date,
          nama_pasien: editableRequest.patient.fullName,
          tanggal_lahir_pasien: editableRequest.patient.birthDate,
          nama_nakes: editableRequest.requestedBy,
          total: totals.grandTotal,
          diskon: editableRequest.discount ?? 0,
          serviceFee: editableRequest.serviceFee ?? 0,
          items: editableRequest.drugs.map((drug) => ({
            productId: drug.productId,
            quantity: drug.quantity,
            price: drug.price || 0,
          })),
          services: editableRequest.services.map((service) => ({
            serviceId: service.id,
            price: service.price,
          })),
        },
      });

      setSelectedRequest({
        ...editableRequest,
        totalAmount: totals.grandTotal,
      });
      setProcessDiscount(editableRequest.discount ?? 0);
      setProcessServiceFee(editableRequest.serviceFee ?? 0);
      setIsEditMode(false);
      showToast("Detail permintaan berhasil diperbarui.", "success");
    } catch (error) {
      console.error("Error updating stock out request:", error);
      showToast(withErrorDetail("Gagal menyimpan perubahan detail permintaan", error), "error");
    }
  };

  const formatDateForDisplay = (value?: string, options?: Intl.DateTimeFormatOptions) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '-';
    return parsed.toLocaleDateString('id-ID', options || { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatDateTimeForDisplay = (value?: string) => {
    if (!value) return '-';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const detailRequest = isEditMode && editableRequest ? editableRequest : selectedRequest;

  return (
    <>
      <div className="space-y-6">
        {/* ... Header and List sections ... */}
        <div className="bg-card-light dark:bg-card-dark rounded-3xl p-6 shadow-soft flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-primary"></span>
              <h4 className="text-sm font-bold text-text-primary-light dark:text-white uppercase tracking-wider">
                {isNakes ? "Permintaan Obat" : "Pusat Kendali Pengeluaran"}
              </h4>
            </div>
            <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm max-w-xl">
              {isNakes
                ? "Ajukan permintaan obat dan alkes untuk pasien melalui formulir di sini."
                : "Kelola pengeluaran stok melalui formulir permintaan medis terintegrasi atau lakukan pencatatan manual cepat."}
            </p>
          </div>

          <div className="flex gap-2 sm:gap-3 shrink-0">
            {canCreateRequest && (
              <Button
                onClick={() => setIsRequestFormOpen(true)}
                size="sm"
                className="flex items-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-3 sm:px-4 text-sm transition-all w-auto"
              >
                <span className="material-icons-round text-base">
                  medication
                </span>
                <span>Buat Permintaan</span>
              </Button>
            )}

            {canManualStock && (
              <Button
                onClick={() => setIsManualModalOpen(true)}
                variant="outline"
                className="flex items-center gap-1.5 sm:gap-2 h-9 sm:h-10 px-3 sm:px-4 text-sm shadow-sm hover:shadow-md transition-all bg-white dark:bg-card-dark text-primary border-primary/20 hover:border-primary/50"
              >
                <span className="material-icons-round text-sm sm:text-base">
                  edit_note
                </span>
                <span>Stok Manual</span>
              </Button>
            )}
          </div>
        </div>

        {/* Main Table Section */}
        <div className="bg-card-light dark:bg-card-dark rounded-[20px] shadow-soft overflow-hidden p-6">
          <div className="ps-0 pt-0 p-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-background-light dark:bg-background-dark rounded-xl">
                <span className="material-icons-round text-primary">
                  pending_actions
                </span>
              </div>
              <h3 className="font-bold text-xl text-text-primary-light dark:text-white tracking-tight">
                {isNakes
                  ? "Riwayat Permintaan Saya"
                  : "Antrean Permintaan Obat"}
              </h3>
            </div>
            <div className="flex p-1 bg-background-light dark:bg-background-dark rounded-xl">
              {["Semua", "Menunggu", "Selesai"].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setFilterStatus(status);
                  }}
                  className={`px-5 py-2 text-sm font-bold rounded-lg transition-all ${
                    filterStatus === status
                      ? "bg-white dark:bg-card-light shadow-sm text-text-primary-light dark:text-text-primary-dark"
                      : "text-text-secondary-light hover:text-text-primary-light dark:hover:text-white"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="flex items-center gap-1.5" onClick={() => void exportStockOutToExcel(filteredRequests)}>
                <span className="material-icons-round text-sm">file_download</span> Ekspor
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {isRequestsLoading ? (
              <div className="space-y-2 p-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-14 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse"
                    style={{ opacity: 1 - i * 0.15 }}
                  />
                ))}
                <p className="text-center text-xs text-text-secondary-light mt-3 pb-2">
                  Memuat data transaksi...
                </p>
              </div>
            ) : (
              <>
                <DataTable
                  columns={createStockOutColumns({
                    onView: (req) => {
                      setSelectedRequest(req);
                      setIsProcessMode(false);
                      setProcessDiscount(req.discount || 0);
                      setProcessServiceFee(req.serviceFee || 0);
                    },
                    onProcess: (req) => {
                      setSelectedRequest(req);
                      setIsProcessMode(true);
                      setProcessDiscount(req.discount || 0);
                      setProcessServiceFee(req.serviceFee || 0);
                    },
                    isFarmasi: isFarmasi || isAdmin,
                  })}
                  data={filteredRequests}
                  searchable={false}
                  pageSize={perPage}
                />
              </>
            )}
          </div>
        </div>

        {/* Timeline Section (below table) */}
        <div className="bg-card-light dark:bg-card-dark rounded-[20px] shadow-soft p-6 mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h3 className="font-bold text-xl text-text-primary-light dark:text-white">
              Riwayat Pengeluaran
            </h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5"
                onClick={() => setShowTimeline((prev) => !prev)}
              >
                <span className="material-icons-round text-sm">
                  {showTimeline ? "visibility_off" : "visibility"}
                </span>
                {showTimeline ? "Sembunyikan" : "Tampilkan"}
              </Button>
              <button
                onClick={() => refreshTimeline()}
                className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-primary"
                title="Refresh Timeline"
              >
                <span className="material-icons-round text-sm">refresh</span>
              </button>
            </div>
          </div>

          {showTimeline && (
            <div className="relative pl-2 border-l-2 border-gray-100 dark:border-gray-700 space-y-8 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {timelineData.length > 0 ? (
                timelineData.map((item, i) => (
                  <TimelineItem
                    key={i}
                    title={item.title}
                    desc={
                      <span className="text-text-primary-light dark:text-white">
                        {item.desc}
                      </span>
                    }
                    time={item.time}
                    dotColor={item.dotColor}
                  />
                ))
              ) : (
                <div className="text-center py-10 text-text-secondary-light">
                  <p>Belum ada riwayat pengeluaran.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {isManualModalOpen && (
        <StockOutManualForm
          onSave={handleSaveManualRecord}
          onClose={() => setIsManualModalOpen(false)}
          isLoading={createTransaction.isPending}
        />
      )}

      {isRequestFormOpen && (
        <StockOutRequestForm
          onSave={handleSaveRequest}
          onClose={() => setIsRequestFormOpen(false)}
          isLoading={createTransaction.isPending}
        />
      )}

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-card-dark w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl flex flex-col animate-scaleUp">
            <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-white/5 sticky top-0 backdrop-blur-md z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-icons-round text-primary">
                    receipt_long
                  </span>
                  <h3 className="text-xl font-bold text-text-primary-light dark:text-white">
                    {isProcessMode ? "Proses Permintaan" : isEditMode ? "Edit Detail Permintaan" : "Detail Permintaan"}
                  </h3>
                </div>
                <p className="text-sm text-text-secondary-light">
                  {selectedRequest.requestId} • {formatDateTimeForDisplay(selectedRequest.date)}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedRequest(null);
                  setIsEditMode(false);
                }}
                className="p-2 hover:bg-gray-200 dark:hover:bg-white/10 rounded-full transition-colors"
              >
                <span className="material-icons-round">close</span>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Patient Card - Cleaned Up */}
              <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-500/20 flex gap-4 items-center">
                <div className="p-3 bg-white dark:bg-white/10 rounded-xl shadow-sm">
                  <span className="material-icons-round text-primary text-3xl">
                    person
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-text-secondary-light uppercase tracking-wider font-bold mb-1">
                    Nama Pasien
                  </p>
                  {isEditMode && editableRequest ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={editableRequest.patient.fullName}
                        onChange={(e) =>
                          setEditableRequest({
                            ...editableRequest,
                            patient: {
                              ...editableRequest.patient,
                              fullName: e.target.value,
                            },
                          })
                        }
                        className="rounded-xl border border-blue-200 dark:border-blue-500/20 bg-white dark:bg-card-dark px-4 py-3 text-sm font-semibold text-text-primary-light dark:text-white"
                        placeholder="Nama pasien"
                      />
                      <input
                        type="date"
                        value={editableRequest.patient.birthDate || ""}
                        onChange={(e) =>
                          setEditableRequest({
                            ...editableRequest,
                            patient: {
                              ...editableRequest.patient,
                              birthDate: e.target.value,
                            },
                          })
                        }
                        className="rounded-xl border border-blue-200 dark:border-blue-500/20 bg-white dark:bg-card-dark px-4 py-3 text-sm text-text-primary-light dark:text-white"
                      />
                    </div>
                  ) : (
                    <>
                      <h4 className="font-bold text-xl text-primary dark:text-blue-300">
                        {detailRequest?.patient.fullName}
                      </h4>
                      <p className="text-sm text-text-secondary-light mt-1">
                        Tanggal Lahir: {formatDateForDisplay(detailRequest?.patient.birthDate)}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Status & Requester */}
              <div className="flex gap-4">
                <div className="flex-1 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800">
                  <p className="text-xs uppercase font-bold text-text-secondary-light mb-2">
                    Status Permintaan
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`material-icons-round ${detailRequest?.status === "Menunggu" ? "text-amber-500" : "text-emerald-500"}`}
                    >
                      {detailRequest?.status === "Menunggu"
                        ? "schedule"
                        : "check_circle"}
                    </span>
                    <span className="font-bold text-lg">
                      {detailRequest?.status}
                    </span>
                  </div>
                </div>
                <div className="flex-1 p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-800">
                  <p className="text-xs uppercase font-bold text-text-secondary-light mb-2">
                    Diajukan Oleh
                  </p>
                  <div className="flex items-center gap-2">
                    <img
                      src={selectedRequest.requestedByAvatar}
                      className="size-8 rounded-full"
                      alt=""
                      onError={(e) => {
                        e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
                      }}
                    />
                    {isEditMode && editableRequest ? (
                      <input
                        type="text"
                        value={editableRequest.requestedBy}
                        onChange={(e) =>
                          setEditableRequest({
                            ...editableRequest,
                            requestedBy: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-card-dark px-3 py-2 text-sm font-bold text-text-primary-light dark:text-white"
                      />
                    ) : (
                      <span className="font-bold">
                        {detailRequest?.requestedBy}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <h4 className="font-bold text-lg flex items-center gap-2">
                    <span className="material-icons-round text-primary">
                      medication
                    </span>
                    Item Obat & Alkes
                  </h4>
                  {isEditMode && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={addEditableDrug}
                      className="flex items-center gap-1.5"
                    >
                      <span className="material-icons-round text-sm">add</span>
                      Tambah Item
                    </Button>
                  )}
                </div>
                <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-white/5 text-text-secondary-light font-bold border-b border-gray-100 dark:border-gray-800 uppercase text-xs">
                      <tr>
                        <th className="px-4 py-3">Nama Produk</th>
                        <th className="px-4 py-3 text-center">Jumlah</th>
                        <th className="px-4 py-3 text-right">Harga Satuan</th>
                        <th className="px-4 py-3 text-right">Total</th>
                        {isEditMode && <th className="px-4 py-3 text-center">Aksi</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {(detailRequest?.drugs || []).length > 0 ? (
                        (detailRequest?.drugs || []).map((drug, i) => (
                          <tr key={i}>
                            <td className="px-4 py-3 font-medium text-text-primary-light dark:text-white">
                              {isEditMode ? (
                                <select
                                  value={drug.productId}
                                  onChange={(e) => handleEditDrugChange(drug.id, "productId", e.target.value)}
                                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-card-dark px-3 py-2 text-sm text-text-primary-light dark:text-white"
                                >
                                  {products.map((product) => (
                                    <option key={product.id} value={product.id}>
                                      {product.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                drug.productName
                              )}
                            </td>
                            <td className="px-4 py-3 text-center font-bold">
                              {isEditMode ? (
                                <input
                                  type="number"
                                  min="1"
                                  value={drug.quantity}
                                  onChange={(e) => handleEditDrugChange(drug.id, "quantity", e.target.value)}
                                  className="w-20 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-card-dark px-3 py-2 text-center text-sm text-text-primary-light dark:text-white"
                                />
                              ) : (
                                drug.quantity
                              )}
                            </td>
                            <td className="px-4 py-3 text-right text-text-secondary-light">
                              Rp {(drug.price || 0).toLocaleString("id-ID")}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-text-primary-light dark:text-white">
                              Rp{" "}
                              {((drug.price || 0) * drug.quantity).toLocaleString(
                                "id-ID",
                              )}
                            </td>
                            {isEditMode && (
                              <td className="px-4 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => removeEditableDrug(drug.id)}
                                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                  <span className="material-icons-round text-sm">delete</span>
                                </button>
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={isEditMode ? 5 : 4}
                            className="px-4 py-6 text-center text-text-secondary-light dark:text-text-secondary-dark"
                          >
                            Tidak ada item obat. Permintaan ini hanya berisi jasa.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {isEditMode ? (
                <div>
                  <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <span className="material-icons-round text-primary">
                      medical_services
                    </span>
                    Layanan Tambahan
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {services.map((service) => {
                      const checked = !!editableRequest?.services.some((item) => item.id === service.id);
                      return (
                        <label
                          key={service.id}
                          className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-colors ${
                            checked
                              ? "border-primary bg-primary/5 dark:bg-primary/10"
                              : "border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleEditableService(service.id)}
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <span className="font-medium text-text-primary-light dark:text-white">
                              {service.name}
                            </span>
                          </div>
                          <span className="text-sm font-bold text-primary dark:text-blue-300">
                            Rp {service.price.toLocaleString("id-ID")}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : (
                detailRequest && detailRequest.services.length > 0 && (
                <div>
                  <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                    <span className="material-icons-round text-primary">
                      medical_services
                    </span>
                    Layanan Tambahan
                  </h4>
                  <div className="flex flex-col gap-2">
                    {detailRequest.services.map((svc, i) => (
                      <div
                        key={i}
                        className="flex justify-between items-center p-3 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-white/5"
                      >
                        <span className="font-bold text-sm text-text-primary-light dark:text-white">
                          {svc.name}
                        </span>
                        <span className="font-bold text-sm text-primary dark:text-blue-300">
                          Rp {(svc.price || 0).toLocaleString("id-ID")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                )
              )}

              {/* Financial Summary */}
              <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-5 border border-dashed border-gray-200 dark:border-white/10 space-y-3">
                <div className="flex justify-between text-sm text-text-secondary-light">
                  <span>Total Harga Obat</span>
                  <span className="font-bold text-text-primary-light dark:text-white">
                    Rp{" "}
                    {detailRequest ? getDetailTotals(detailRequest).totalDrugs.toLocaleString(
                      "id-ID",
                    ) : "0"}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-text-secondary-light">
                  <span>Total Harga Jasa</span>
                  <span className="font-bold text-text-primary-light dark:text-white">
                    Rp{" "}
                    {detailRequest
                      ? getDetailTotals(detailRequest).totalServices.toLocaleString("id-ID")
                      : "0"}
                  </span>
                </div>
                {isProcessMode ? (
                  <div className="flex justify-between items-center text-sm text-text-secondary-light">
                    <span>Biaya Layanan</span>
                    <div className="flex items-center gap-2">
                      <span>Rp</span>
                      <input
                        type="number"
                        min="0"
                        value={processServiceFee === 0 ? "" : processServiceFee}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProcessServiceFee(val === "" ? 0 : Math.max(0, Number(val)));
                        }}
                        className="w-32 px-3 py-1.5 text-right rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-card-dark text-text-primary-light dark:text-white focus:ring-primary focus:border-primary font-bold text-primary"
                        placeholder="0"
                      />
                    </div>
                  </div>
                ) : isEditMode && editableRequest ? (
                  <div className="flex justify-between items-center text-sm text-text-secondary-light">
                    <span>Biaya Layanan</span>
                    <div className="flex items-center gap-2">
                      <span>Rp</span>
                      <input
                        type="number"
                        min="0"
                        value={editableRequest.serviceFee === 0 ? "" : editableRequest.serviceFee}
                        onChange={(e) =>
                          setEditableRequest({
                            ...editableRequest,
                            serviceFee: e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)),
                          })
                        }
                        className="w-32 px-3 py-1.5 text-right rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-card-dark text-text-primary-light dark:text-white focus:ring-primary focus:border-primary font-bold text-primary"
                        placeholder="0"
                      />
                    </div>
                  </div>
                ) : (
                  detailRequest && getDetailTotals(detailRequest).serviceFee > 0 && (
                    <div className="flex justify-between text-sm text-text-secondary-light">
                      <span>Biaya Layanan</span>
                      <span className="font-bold text-text-primary-light dark:text-white">
                        Rp {getDetailTotals(detailRequest).serviceFee.toLocaleString("id-ID")}
                      </span>
                    </div>
                  )
                )}
                {isProcessMode ? (
                  <div className="flex justify-between items-center text-sm text-text-secondary-light">
                    <span>Diskon</span>
                    <div className="flex items-center gap-2">
                      <span>- Rp</span>
                      <input
                        type="number"
                        min="0"
                        value={processDiscount === 0 ? "" : processDiscount}
                        onChange={(e) => {
                          const val = e.target.value;
                          setProcessDiscount(val === "" ? 0 : Math.max(0, Number(val)));
                        }}
                        className="w-32 px-3 py-1.5 text-right rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-card-dark text-text-primary-light dark:text-white focus:ring-primary focus:border-primary font-bold text-red-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                ) : isEditMode && editableRequest ? (
                  <div className="flex justify-between items-center text-sm text-text-secondary-light">
                    <span>Diskon</span>
                    <div className="flex items-center gap-2">
                      <span>- Rp</span>
                      <input
                        type="number"
                        min="0"
                        value={editableRequest.discount === 0 ? "" : editableRequest.discount}
                        onChange={(e) =>
                          setEditableRequest({
                            ...editableRequest,
                            discount: e.target.value === "" ? 0 : Math.max(0, Number(e.target.value)),
                          })
                        }
                        className="w-32 px-3 py-1.5 text-right rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-card-dark text-text-primary-light dark:text-white focus:ring-primary focus:border-primary font-bold text-red-500"
                        placeholder="0"
                      />
                    </div>
                  </div>
                ) : (
                  detailRequest && getDetailTotals(detailRequest).discount > 0 && (
                    <div className="flex justify-between text-sm text-text-secondary-light">
                      <span>Diskon</span>
                      <span className="font-bold text-red-500">
                        - Rp {getDetailTotals(detailRequest).discount.toLocaleString("id-ID")}
                      </span>
                    </div>
                  )
                )}
                <div className="border-t border-gray-200 dark:border-white/10 pt-3 flex justify-between items-center">
                  <span className="font-bold text-lg text-primary dark:text-white">
                    Total Keseluruhan
                  </span>
                  <span className="font-extrabold text-2xl text-primary dark:text-white">
                    Rp{" "}
                    {detailRequest ? getDetailTotals(detailRequest).grandTotal.toLocaleString("id-ID") : "0"}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3 bg-gray-50/50 dark:bg-white/5 rounded-b-3xl">
              <button
                onClick={() => {
                  if (isEditMode) {
                    setEditableRequest(selectedRequest);
                    setIsEditMode(false);
                    return;
                  }
                  setSelectedRequest(null);
                }}
                className="px-6 py-2.5 rounded-xl font-bold text-text-secondary-light hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                {isEditMode ? "Batal" : "Tutup"}
              </button>
              {!isProcessMode && selectedRequest.status === "Menunggu" && canEditRequest(selectedRequest) && !isEditMode && (
                <button
                  onClick={() => setIsEditMode(true)}
                  className="px-6 py-2.5 rounded-xl font-bold border border-primary/20 text-primary hover:bg-primary/10 transition-colors flex items-center gap-2"
                >
                  <span className="material-icons-round text-sm">edit</span>
                  Edit Detail
                </button>
              )}
              {isEditMode && (
                <button
                  onClick={handleSaveDetailEdit}
                  disabled={updateRequestMutation.isPending}
                  className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/30 hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  <span className="material-icons-round text-sm">
                    {updateRequestMutation.isPending ? "refresh" : "save"}
                  </span>
                  {updateRequestMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              )}
              {isProcessMode &&
                selectedRequest.status === "Menunggu" &&
                canProcessRequest && (
                  <button
                    onClick={() => {
                      // Transition to Confirmation Modal
                      setRequestToProcess(selectedRequest);
                      setSelectedRequest(null);
                    }}
                    className="bg-primary text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/30 hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <span className="material-icons-round text-sm">
                      check_circle
                    </span>
                    Proses Permintaan
                  </button>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {requestToProcess && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-card-dark w-full max-w-md rounded-3xl shadow-2xl p-6 animate-scaleUp text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
              <span className="material-icons-round text-4xl">inventory</span>
            </div>
            <h3 className="text-2xl font-bold text-text-primary-light dark:text-white mb-2">
              Proses Permintaan?
            </h3>
            <p className="text-text-secondary-light mb-6">
              Anda akan memproses permintaan untuk pasien{" "}
              <span className="font-bold text-primary">
                {requestToProcess.patient.fullName}
              </span>
              . Jika ada item obat, stok akan dikurangi secara otomatis sesuai item yang diminta.
            </p>

            <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-4 mb-6 text-left border border-gray-100 dark:border-white/10 max-h-40 overflow-y-auto">
              <p className="text-xs font-bold text-text-secondary-light uppercase mb-2">
                Ringkasan Item:
              </p>
              <ul className="space-y-2">
                {requestToProcess.drugs.length > 0 ? (
                  requestToProcess.drugs.map((d, i) => (
                    <li key={i} className="flex justify-between text-sm">
                      <span className="text-text-primary-light dark:text-white">
                        {d.productName}
                      </span>
                      <span className="font-bold">x{d.quantity}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                    Tidak ada item obat. Permintaan ini hanya berisi jasa.
                  </li>
                )}
              </ul>
              {requestToProcess.services.length > 0 && (
                <>
                  <p className="text-xs font-bold text-text-secondary-light uppercase mb-2 mt-4">
                    Ringkasan Jasa:
                  </p>
                  <ul className="space-y-2">
                    {requestToProcess.services.map((service, i) => (
                      <li key={`svc-${i}`} className="flex justify-between text-sm">
                        <span className="text-text-primary-light dark:text-white">
                          {service.name}
                        </span>
                        <span className="font-bold">
                          Rp {service.price.toLocaleString("id-ID")}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {processServiceFee > 0 && (
                <div className="mt-3 pt-3 border-t border-dashed border-gray-200 dark:border-white/10 flex justify-between text-sm">
                  <span className="text-text-secondary-light">Biaya Layanan</span>
                  <span className="font-bold text-text-primary-light dark:text-white">Rp {processServiceFee.toLocaleString("id-ID")}</span>
                </div>
              )}
              {processDiscount > 0 && (
                <div className={`${processServiceFee > 0 ? 'mt-2' : 'mt-3 pt-3 border-t border-dashed border-gray-200 dark:border-white/10'} flex justify-between text-sm`}>
                  <span className="text-text-secondary-light">Diskon Diberikan</span>
                  <span className="font-bold text-red-500">- Rp {processDiscount.toLocaleString("id-ID")}</span>
                </div>
              )}
              {(() => {
                const subtotal = getDetailTotals(requestToProcess).totalDrugs + getDetailTotals(requestToProcess).totalServices;
                const finalTotal = Math.max(0, subtotal + processServiceFee - processDiscount);
                return (
                  <div className={`flex justify-between text-sm ${processDiscount === 0 && processServiceFee === 0 ? 'mt-3 pt-3 border-t border-dashed border-gray-200 dark:border-white/10' : 'mt-2'}`}>
                    <span className="text-text-primary-light dark:text-white font-bold">Total Tagihan</span>
                    <span className="font-bold text-primary dark:text-blue-300">Rp {finalTotal.toLocaleString("id-ID")}</span>
                  </div>
                );
              })()}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setRequestToProcess(null)}
                className="flex-1 py-3 text-text-secondary-light font-bold hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={processRequest}
                disabled={processTransaction.isPending}
                className="flex-1 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/30 hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {processTransaction.isPending ? (
                  <>
                    <span className="material-icons-round text-lg animate-spin">refresh</span>
                    Memproses...
                  </>
                ) : (
                  <>
                    <span className="material-icons-round text-lg">check_circle</span>
                    Ya, Proses
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const TimelineItem: React.FC<{
  title: string;
  desc: React.ReactNode;
  time: string;
  dotColor: string;
}> = ({ title, desc, time, dotColor }) => (
  <div className="relative pl-6">
    <div
      className={`absolute -left-[9px] top-0.5 size-4 ${dotColor} rounded-full border-[3px] border-white dark:border-card-dark shadow-sm`}
    ></div>
    <div className="flex flex-col gap-0.5">
      <p className="text-sm font-bold text-text-primary-light dark:text-white leading-tight">
        {title}
      </p>
      <div className="text-xs text-text-secondary-light dark:text-text-secondary-dark leading-relaxed">
        {desc}
      </div>
      <div className="flex items-center gap-1 mt-1">
        <span className="material-icons-round text-[10px] text-text-secondary-light">schedule</span>
        <p className="text-[10px] text-text-secondary-light font-medium uppercase tracking-wider">
          {time}
        </p>
      </div>
    </div>
  </div>
);

export default StockOutManagement;
