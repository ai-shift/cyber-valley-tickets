import { apiClient } from "@/shared/api";

export const submitIndividualVerification = async (ktp: File) => {
  const formData = new FormData();
  formData.append("ktp", ktp);

  return await apiClient.POST("/api/shaman/verify/individual", {
    // @ts-ignore
    body: formData,
  });
};

export const submitCompanyVerification = async (
  ktp: File,
  akta: File,
  sk: File,
) => {
  const formData = new FormData();
  formData.append("ktp", ktp);
  formData.append("akta", akta);
  formData.append("sk", sk);

  return await apiClient.POST("/api/shaman/verify/company", {
    // @ts-ignore
    body: formData,
  });
};
