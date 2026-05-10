
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ItemCard } from "./ItemCard";
import { Skeleton } from "@/components/ui/skeleton";
import { BrainCircuit } from "lucide-react";
import { MarketplaceItem, Profile } from "@/types/database";
import { getSmartRecommendationReasoning } from "@/lib/groq";
import { useState, useEffect } from "react";

interface RecommendedItemsProps {
  userId?: string;
  category?: string;
}

export function RecommendedItems({ userId, category = "All" }: RecommendedItemsProps) {
  const [aiReasoning, setAiReasoning] = useState("AI-powered suggestions based on your interests.");

  const { data: profile } = useQuery<Profile | null>({
    queryKey: ['profile', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      return data;
    }
  });

  const { data: recommendedItems = [], isLoading } = useQuery<MarketplaceItem[]>({
    queryKey: ['recommended-marketplace-items', userId, category],
    queryFn: async () => {
      let items: any[] = [];
      
      // 1. Get personalized recs (always 4)
      if (userId) {
        const { data, error } = await supabase.rpc('get_personalized_recommendations', {
          p_user_id: userId,
          p_limit: 4
        });
        if (!error && data) items = data;
      }

      // 2. If we have no items or need fallback
      if (items.length === 0) {
        const { data } = await supabase
          .from('marketplace_items')
          .select('*')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(4);
        if (data) items = data;
      }

      // 3. DYNAMIC INJECT: If user is browsing a specific category, 
      // replace the last 2 items with items from that category
      if (category !== "All" && items.length >= 2) {
        const { data: categoryItems } = await supabase
          .from('marketplace_items')
          .select('*')
          .eq('status', 'approved')
          .eq('category', category)
          .order('created_at', { ascending: false })
          .limit(2);
        
        if (categoryItems && categoryItems.length > 0) {
            // Keep first 2 personalized, add 2 from current category
            const personalized = items.slice(0, 2);
            // Ensure no duplicates
            const filteredCategoryItems = categoryItems.filter(ci => !personalized.some(p => p.id === ci.id));
            items = [...personalized, ...filteredCategoryItems];
        }
      }

      // Hydrate profiles
      const itemIds = items.map((item: any) => item.id);
      const { data: hydratedItems } = await supabase
        .from('marketplace_items')
        .select('*, profiles!seller_id(*)')
        .in('id', itemIds);

      return hydratedItems || [];
    }
  });

  // Use Groq AI to generate a smart headline
  useEffect(() => {
    if (recommendedItems.length > 0) {
      getSmartRecommendationReasoning(profile, recommendedItems).then(reason => {
        setAiReasoning(reason);
      });
    }
  }, [recommendedItems, profile]);

  if (!isLoading && recommendedItems.length === 0) return null;

  return (
    <section className="container mx-auto px-6 lg:px-8 pt-12 pb-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl md:text-2xl font-display font-bold tracking-tight text-white">
          {category !== "All" ? `Trending in ${category}` : "Recommended for You"}
        </h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-[220px] w-full rounded-2xl bg-zinc-900/50" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4 bg-zinc-900/50" />
                <Skeleton className="h-4 w-1/2 bg-zinc-900/50" />
              </div>
            </div>
          ))
        ) : (
          recommendedItems.map((item) => (
            <ItemCard key={item.id} item={item} isLoggedIn={!!userId} />
          ))
        )}
      </div>
    </section>
  );
}
