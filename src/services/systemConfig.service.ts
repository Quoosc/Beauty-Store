import api from "@/lib/axios";
import type { ApiResponse, SystemConfig } from "@/types";

export const systemConfigService = {
  getAll: async (): Promise<SystemConfig[]> => {
    const res = await api.get<ApiResponse<SystemConfig[]>>(`/auth/system-configs`);
    return res.data.data;
  },

  /** BE nhận { configValue: string } — không phải { value: string } */
  update: async (key: string, configValue: string): Promise<SystemConfig> => {
    const res = await api.put<ApiResponse<SystemConfig>>(
      `/auth/system-configs/${key}`,
      { configValue }
    );
    return res.data.data;
  },

  /** Tìm theo configKey — không phải key */
  getByKey: async (key: string): Promise<SystemConfig> => {
    const configs = await systemConfigService.getAll();
    const found = configs.find((config) => config.configKey === key);
    if (!found) {
      throw new Error("Khong tim thay system config");
    }
    return found;
  },
};
