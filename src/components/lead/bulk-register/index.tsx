import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import PageMeta from "../../../components/common/PageMeta";
import ComponentCard from "../../../components/common/ComponentCard";
import BulkRegistrationButton from './BulkRegistrationButton'

export default function BulkEntry() {
  return (
    <div>
      <PageMeta
        title="Lead Entry | IPKwealth"
        description="Bulk import leads into IPK-CRM."
      />
      <PageBreadcrumb pageTitle="BulkEntry" />

      <div className="grid grid-cols-1 gap-6">
        <ComponentCard title="Bulk Registration">
          <div className="max-w-3xl mx-auto space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Upload a CSV / XLS / XLSX file to register multiple leads at once.
              Please ensure your file matches the required header format.
            </p>

            {/* Your existing bulk-upload drawer / workflow */}
            <BulkRegistrationButton />

            <div className="pt-3 text-xs text-gray-500 dark:text-gray-400">
              Tip: After upload, you can review the parsed rows and confirm to
              create leads. Invalid rows will be highlighted for correction.
            </div>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}
