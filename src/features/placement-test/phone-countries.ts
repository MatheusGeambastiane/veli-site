import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js/min";

export type PhoneCountry = {
  code: CountryCode;
  name: string;
  dialCode: string;
};

const names = new Intl.DisplayNames(["pt-BR"], { type: "region" });

// Includes territories with telephone numbering plans, including shared DDIs.
export const phoneCountries: PhoneCountry[] = getCountries()
  .map((code) => ({
    code,
    name: names.of(code) ?? code,
    dialCode: getCountryCallingCode(code),
  }))
  .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
