import { TrashBinIcon } from "@/icons";
import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";

type DealStatus = "Complete" | "Pending" | "Cancel";

type DealRow = {
  id: string;
  customer: string;
  email: string;
  product: string;
  value: string;
  closeDate: string;
  status: DealStatus;
};

const deals: DealRow[] = [
  {
    id: "DE124321",
    customer: "John Doe",
    email: "johndoe@gmail.com",
    product: "Software License",
    value: "$18,503.40",
    closeDate: "2024-06-15",
    status: "Complete",
  },
  {
    id: "DE124322",
    customer: "Jane Smith",
    email: "janesmith@gmail.com",
    product: "Cloud Hosting",
    value: "$12,990.00",
    closeDate: "2024-06-18",
    status: "Pending",
  },
  {
    id: "DE124323",
    customer: "Michael Brown",
    email: "michaelbrown@gmail.com",
    product: "Web Domain",
    value: "$9,500.00",
    closeDate: "2024-06-20",
    status: "Cancel",
  },
  {
    id: "DE124324",
    customer: "Alice Johnson",
    email: "alicejohnson@gmail.com",
    product: "SSL Certificate",
    value: "$2,340.45",
    closeDate: "2024-06-25",
    status: "Pending",
  },
  {
    id: "DE124325",
    customer: "Robert Lee",
    email: "robertlee@gmail.com",
    product: "Premium Support",
    value: "$15,200.00",
    closeDate: "2024-06-30",
    status: "Complete",
  },
];

const statusTone: Record<DealStatus, { color: "success" | "warning" | "error"; label: string }> = {
  Complete: { color: "success", label: "Complete" },
  Pending: { color: "warning", label: "Pending" },
  Cancel: { color: "error", label: "Cancel" },
};

export default function RecentDeals() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-4 pt-5 dark:border-gray-800 dark:bg-white/5 sm:px-6">
      <div className="flex flex-col gap-2 mb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">Recent Deals</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Latest closed and in-progress opportunities</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200">
            Filter
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-200">
            See all
          </button>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-y border-gray-100 dark:border-gray-800">
            <TableRow>
              <TableCell isHeader className="py-3 text-left text-theme-xs font-medium uppercase text-gray-500 dark:text-gray-400">Deal ID</TableCell>
              <TableCell isHeader className="py-3 text-left text-theme-xs font-medium uppercase text-gray-500 dark:text-gray-400">Customer</TableCell>
              <TableCell isHeader className="py-3 text-left text-theme-xs font-medium uppercase text-gray-500 dark:text-gray-400">Product / Service</TableCell>
              <TableCell isHeader className="py-3 text-left text-theme-xs font-medium uppercase text-gray-500 dark:text-gray-400">Deal Value</TableCell>
              <TableCell isHeader className="py-3 text-left text-theme-xs font-medium uppercase text-gray-500 dark:text-gray-400">Close Date</TableCell>
              <TableCell isHeader className="py-3 text-left text-theme-xs font-medium uppercase text-gray-500 dark:text-gray-400">Status</TableCell>
              <TableCell isHeader className="py-3 text-right text-theme-xs font-medium uppercase text-gray-500 dark:text-gray-400">Action</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {deals.map((deal) => {
              const tone = statusTone[deal.status];
              return (
                <TableRow key={deal.id}>
                  <TableCell className="py-3 text-sm font-medium text-gray-700 dark:text-white/80">{deal.id}</TableCell>
                  <TableCell className="py-3 text-sm text-gray-700 dark:text-white/80">
                    <div className="flex flex-col">
                      <span className="font-medium">{deal.customer}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{deal.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-sm text-gray-500 dark:text-gray-400">{deal.product}</TableCell>
                  <TableCell className="py-3 text-sm font-medium text-gray-700 dark:text-white/80">{deal.value}</TableCell>
                  <TableCell className="py-3 text-sm text-gray-500 dark:text-gray-400">{deal.closeDate}</TableCell>
                  <TableCell className="py-3 text-sm text-gray-500 dark:text-gray-400">
                    <Badge color={tone.color} size="sm">{tone.label}</Badge>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <button className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 transition hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-500/15">
                      <TrashBinIcon className="size-4" />
                    </button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
