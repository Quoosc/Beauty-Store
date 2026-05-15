import api from "@/lib/axios";
import type { ApiResponse, SystemConfig } from "@/types";

export const systemConfigService = {
  getAll: async (): Promise<SystemConfig[]> => {
    const res = await api.get<ApiResponse<SystemConfig[]>>(`/auth/system-configs`);
    return res.data.data;
  },

  update: async (key: string, value: string): Promise<SystemConfig> => {
    const res = await api.put<ApiResponse<SystemConfig>>(
      `/auth/system-configs/${key}`,
      { value }
    );
    return res.data.data;
  },

  getByKey: async (key: string): Promise<SystemConfig> => {
    const configs = await systemConfigService.getAll();
    const found = configs.find((config) => config.key === key);
    if (!found) {
      throw new Error("Khong tim thay system config");
    }
    return found;
  },
};
