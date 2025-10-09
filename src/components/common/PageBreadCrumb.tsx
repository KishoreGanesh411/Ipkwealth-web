import { Link } from "react-router-dom";

type BreadcrumbItem = {
  label: string;
  href: string;
};

interface BreadcrumbProps {
  pageTitle: string;
  items?: BreadcrumbItem[];
}

const PageBreadcrumb: React.FC<BreadcrumbProps> = ({ pageTitle, items = [] }) => {
  const hasTitle = pageTitle?.trim().length > 0;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <h2
        className="text-xl font-semibold text-gray-800 dark:text-white/90"
        x-text="pageName"
      >
        {pageTitle}
      </h2>
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
          <li>
            <Link className="inline-flex items-center gap-1.5" to="/">
              Home
              <ChevronIcon />
            </Link>
          </li>
          {items.map((item) => (
            <li key={item.href}>
              <Link className="inline-flex items-center gap-1.5" to={item.href}>
                {item.label}
                <ChevronIcon />
              </Link>
            </li>
          ))}
          {hasTitle && (
            <li className="text-gray-800 dark:text-white/90">{pageTitle}</li>
          )}
        </ol>
      </nav>
    </div>
  );
};

function ChevronIcon() {
  return (
    <svg
      className="stroke-current"
      width="17"
      height="16"
      viewBox="0 0 17 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
        stroke=""
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default PageBreadcrumb;
