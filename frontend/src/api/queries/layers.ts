import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { V1Service } from '../../services/akgda/services/V1Service';
import type { Layer } from '../../services/akgda/models/Layer';

// Query keys for layer operations
export const layerKeys = {
    all: ['layers'] as const,
    lists: () => [...layerKeys.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...layerKeys.lists(), filters] as const,
    details: () => [...layerKeys.all, 'detail'] as const,
    detail: (id: number) => [...layerKeys.details(), id] as const,
};

// Query to fetch all layers
export function useLayers() {
    return useQuery({
        queryKey: layerKeys.all,
        queryFn: async () => {
            const response = await V1Service.v1LayersList();
            return response;
        },
    });
}

// Query to fetch a single layer by ID
export function useLayer(id: number) {
    return useQuery({
        queryKey: layerKeys.detail(id),
        queryFn: async () => {
            const response = await V1Service.v1LayersRetrieve(id);
            return response;
        },
        enabled: !!id,
    });
}

// Mutation to create a layer
export function useCreateLayer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (layerData: Layer) => {
            const response = await V1Service.v1LayersCreate(layerData);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: layerKeys.all });
        },
    });
}

// Mutation to update a layer
export function useUpdateLayer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: Layer }) => {
            const response = await V1Service.v1LayersUpdate(id, data);
            return response;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: layerKeys.all });
            queryClient.setQueryData(layerKeys.detail(data.id), data);
        },
    });
}

// Mutation to delete a layer
export function useDeleteLayer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            await V1Service.v1LayersDestroy(id);
            return id;
        },
        onSuccess: (deletedId) => {
            queryClient.invalidateQueries({ queryKey: layerKeys.all });
            queryClient.removeQueries({ queryKey: layerKeys.detail(deletedId) });
        },
    });
}
