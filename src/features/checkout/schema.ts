import { z } from "zod";

const blankToEmpty = z.string().trim();

const isBlank = (value?: string) => !value || value.trim().length === 0;

export const enrollmentSchema = z
  .object({
    languageId: blankToEmpty,
    offerId: blankToEmpty,
    studentClassId: blankToEmpty.optional(),
    schedule: blankToEmpty,
    authMode: z.enum(["register", "login"]),
    firstName: blankToEmpty,
    lastName: blankToEmpty,
    email: blankToEmpty,
    phone: blankToEmpty,
    password: blankToEmpty,
    cep: blankToEmpty,
    city: blankToEmpty,
    state: blankToEmpty,
    country: blankToEmpty,
    address: blankToEmpty,
    addressNumber: blankToEmpty,
    province: blankToEmpty,
  })
  .superRefine((values, ctx) => {
    if (isBlank(values.languageId)) {
      ctx.addIssue({
        code: "custom",
        path: ["languageId"],
        message: "Selecione um idioma.",
      });
    }

    if (isBlank(values.offerId)) {
      ctx.addIssue({
        code: "custom",
        path: ["offerId"],
        message: "Selecione uma oferta.",
      });
    }

    if (isBlank(values.studentClassId) && isBlank(values.schedule)) {
      ctx.addIssue({
        code: "custom",
        path: ["studentClassId"],
        message: "Selecione uma turma ou um turno.",
      });
    }

    if (!/\S+@\S+\.\S+/.test(values.email)) {
      ctx.addIssue({
        code: "custom",
        path: ["email"],
        message: "Informe um e-mail válido.",
      });
    }

    if (isBlank(values.password)) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "Informe sua senha.",
      });
    }

    if (values.authMode === "login") {
      return;
    }

    if (values.password.trim().length < 8) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "A senha precisa ter pelo menos 8 caracteres.",
      });
    }

    if (values.firstName.trim().length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["firstName"],
        message: "Informe seu primeiro nome.",
      });
    }

    if (values.lastName.trim().length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["lastName"],
        message: "Informe seu sobrenome.",
      });
    }

    if (values.phone.trim().length < 10) {
      ctx.addIssue({
        code: "custom",
        path: ["phone"],
        message: "Informe um telefone ou WhatsApp válido.",
      });
    }

    if (values.cep.trim().length < 8) {
      ctx.addIssue({
        code: "custom",
        path: ["cep"],
        message: "Informe um CEP válido.",
      });
    }

    if (values.city.trim().length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["city"],
        message: "Informe a cidade.",
      });
    }

    if (values.state.trim().length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["state"],
        message: "Informe o estado.",
      });
    }

    if (values.country.trim().length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["country"],
        message: "Informe o país.",
      });
    }

    if (values.address.trim().length < 3) {
      ctx.addIssue({
        code: "custom",
        path: ["address"],
        message: "Informe o endereço.",
      });
    }

    if (values.addressNumber.trim().length < 1) {
      ctx.addIssue({
        code: "custom",
        path: ["addressNumber"],
        message: "Informe o número.",
      });
    }

    if (values.province.trim().length < 2) {
      ctx.addIssue({
        code: "custom",
        path: ["province"],
        message: "Informe o bairro.",
      });
    }
  });

export type EnrollmentSchema = z.infer<typeof enrollmentSchema>;
