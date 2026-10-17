import React from 'react';
import {
  X,
  ShieldCheck,
  Phone,
  FileCheck,
  ExternalLink,
  AlertTriangle,
  Users,
} from 'lucide-react';

interface TenantResourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TenantResourcesModal: React.FC<TenantResourcesModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60">
      <div className="modal-enter bg-white rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-stone-200">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">
                Toronto Tenant Rights & Legal Resources
              </h3>
              <p className="text-xs text-stone-500">
                Official helplines, tenant advocacy, and eviction prevention services
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-stone-700">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2 text-amber-900">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
            <p className="leading-relaxed">
              <strong>Notice:</strong> TrueRent Toronto is a civic analysis tool. Neither this app nor Google Gemini provides legal or financial advice. If you are experiencing eviction threats, illegal rent hikes, or maintenance issues, contact the accredited free resources below.
            </p>
          </div>

          {/* Resource 1: FMTA */}
          <div className="p-4 rounded-xl border border-stone-200 bg-white hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-bold text-stone-900 text-sm">
                Federation of Metro Tenants&apos; Associations (FMTA)
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                Free &amp; Confidential
              </span>
            </div>
            <p className="text-stone-600 mb-2">
              Non-profit organisation dedicated to tenant rights. Offers a free tenant hotline answering questions on leases, rent increases, repairs, and landlord disputes.
            </p>
            <div className="flex items-center gap-2 font-mono text-emerald-800 font-bold text-sm">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>Tenant Hotline: 416-921-4070</span>
            </div>
          </div>

          {/* Resource 2: LTB */}
          <div className="p-4 rounded-xl border border-stone-200 bg-white hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-bold text-stone-900 text-sm">
                Landlord and Tenant Board (LTB) of Ontario
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700">
                Provincial Tribunal
              </span>
            </div>
            <p className="text-stone-600 mb-2">
              The official adjudicative tribunal under Tribunals Ontario that resolves disputes between residential landlords and tenants under the Residential Tenancies Act (RTA).
            </p>
            <div className="text-stone-500 text-[11px]">
              Toll-free: 1-888-332-3234 &bull; Official Guideline Rent Cap: 2.5% in 2024/2025 for rent-controlled units.
            </div>
          </div>

          {/* Resource 3: ACTO */}
          <div className="p-4 rounded-xl border border-stone-200 bg-white hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-bold text-stone-900 text-sm">
                Advocacy Centre for Tenants Ontario (ACTO)
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700">
                Legal Aid Clinic
              </span>
            </div>
            <p className="text-stone-600">
              Specialist legal clinic funded by Legal Aid Ontario, working to protect the housing rights of low-income tenants through systemic test cases, research, and reform.
            </p>
          </div>

          {/* Resource 4: Toronto Rent Bank */}
          <div className="p-4 rounded-xl border border-stone-200 bg-white hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-bold text-stone-900 text-sm">
                Toronto Rent Bank (Eviction Prevention in the Community)
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                Grant / Loan Support
              </span>
            </div>
            <p className="text-stone-600">
              Provides interest-free grants and loans to low-to-moderate-income households facing eviction due to short-term rent or utility arrears.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
