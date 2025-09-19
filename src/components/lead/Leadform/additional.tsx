import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import Select from "../../../components/form/Select";
import { GenderIcon, ProffessionIcon, ProductIcon } from "../../../icons";
import {
  genderOptions,
  professionOptions,
  productOptions,
  clientTypeOptions,
  investmentOptions,
} from "../../../components/lead/types";

interface AdditionalInsightsFormProps {
  lead: any;
  setLead: (value: any) => void;
  isCompanyRequired: boolean; // true for BUSINESS/EMPLOYEE
}

const IconWrap = ({ children }: { children: React.ReactNode }) => (
  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400 dark:text-white/50">
    {children}
  </span>
);

export default function AdditionalInsightsForm({
  lead,
  setLead,
  isCompanyRequired,
}: AdditionalInsightsFormProps) {
  const setClientType = (value: string) => {
    setLead((s: any) => ({ ...s, clientType: value }));
  };

  const isSelfEmployed = lead.profession === "SELF_EMPLOYED"; // NEW

  return (
    <div className="space-y-3">
      {/* Row 1: Gender & Age */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label>Gender</Label>
          <div className="relative">
            <IconWrap>
              <GenderIcon className="h-4 w-4" />
            </IconWrap>
            <Select
              className="pl-9"
              options={genderOptions}
              value={lead.gender}
              onChange={(val: string) => setLead({ ...lead, gender: val })}
            />
          </div>
        </div>
        <div>
          <Label>Age</Label>
          <div className="relative">
            <Input
              className="pl-3"
              type="number"
              value={lead.age}
              onChange={(e) =>
                setLead({
                  ...lead,
                  age: e.target.value ? Number(e.target.value) : "",
                })
              }
              placeholder="Age"
            />
          </div>
        </div>
      </div>

      {/* Row 2: Profession & Company/Designation */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label>Profession</Label>
          <div className="relative">
            <IconWrap>
              <ProffessionIcon className="h-4 w-4" />
            </IconWrap>
            <Select
              className="pl-9"
              options={professionOptions} // must include SELF_EMPLOYED
              value={lead.profession}
              onChange={(val: string) =>
                setLead({
                  ...lead,
                  profession: val,
                  companyName: "",
                  designation: "",
                })
              }
            />
          </div>
        </div>

        {/* BUSINESS/EMPLOYEE → show both fields */}
        {isCompanyRequired && !isSelfEmployed && (
          <>
            <div>
              <Label>Company</Label>
              <Input
                value={lead.companyName}
                onChange={(e) =>
                  setLead({
                    ...lead,
                    companyName: e.target.value,
                  })
                }
                placeholder="Company name"
              />
            </div>
            <div>
              <Label>Designation</Label>
              <Input
                value={lead.designation}
                onChange={(e) =>
                  setLead({
                    ...lead,
                    designation: e.target.value,
                  })
                }
                placeholder="Designation"
              />
            </div>
          </>
        )}

        {/* SELF_EMPLOYED → show only Designation */}
        {isSelfEmployed && (
          <div className="md:col-span-1">
            <Label>Designation</Label>
            <Input
              value={lead.designation}
              onChange={(e) =>
                setLead({ ...lead, designation: e.target.value })
              }
              placeholder="e.g., Trader, Consultant"
            />
          </div>
        )}
      </div>

      {/* Row 3: Location */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="relative">
          <Label>Location</Label>
          <Input
            value={lead.location}
            onChange={(e) => setLead({ ...lead, location: e.target.value })}
            placeholder="City / Area"
          />
        </div>
      </div>

      {/* Row 4: Product & conditional fields */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <Label>Product</Label>
          <div className="relative">
            <IconWrap>
              <ProductIcon className="h-4 w-4" />
            </IconWrap>
            <Select
              className="pl-9"
              options={productOptions}
              value={lead.product}
              onChange={(val: string) =>
                setLead({
                  ...lead,
                  product: val,
                  investmentRange: "",
                  sipAmount: "",
                })
              }
            />
          </div>
        </div>

        {lead.product === "IAP" && (
          <div>
            <Label>Investment Range (IAP)</Label>
            <Select
              options={investmentOptions}
              value={lead.investmentRange}
              onChange={(val: string) =>
                setLead({
                  ...lead,
                  investmentRange: val,
                })
              }
            />
          </div>
        )}

        {lead.product === "SIP" && (
          <div>
            <Label>SIP Amount (₹)</Label>
            <Input
              type="number"
              value={lead.sipAmount}
              onChange={(e) =>
                setLead({
                  ...lead,
                  sipAmount: e.target.value ? Number(e.target.value) : "",
                })
              }
              placeholder="e.g., 2000"
            />
          </div>
        )}
      </div>

      {/* Row 5: Client Type (radio) */}
      <div>
        <Label>Client Type</Label>
        <div className="mt-2 flex flex-wrap gap-3">
          {clientTypeOptions.map((label) => {
            const checked = lead.clientType === label;
            return (
              <label
                key={label}
                className={
                  `inline-flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all ` +
                  (checked
                    ? "border-green-600 bg-green-50 text-green-800 shadow-sm dark:bg-green-600/20 dark:text-green-300"
                    : "border-gray-300 bg-white text-gray-700 hover:border-green-500/60 hover:text-green-700 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300")
                }
              >
                <input
                  type="radio"
                  name="clientType"
                  value={label}
                  checked={checked}
                  onChange={() => setClientType(label)}
                  className="hidden"
                />
                <span>{label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
