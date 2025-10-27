import apiClient from "@/shared/api/client";

export const submitIndividualVerification = async (ktp: File) => {
  const formData = new FormData();
  formData.append("ktp", ktp);

  return await apiClient.POST("/api/shaman/verify/individual", {
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
    body: formData,
  });
};
