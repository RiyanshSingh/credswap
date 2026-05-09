import {
    Laptop, // Electronics
    Wallet, // Wallets & IDs
    Glasses, // Accessories
    BookOpen, // Books & Notebooks
    Key, // Keys
    Shirt, // Clothing
    Archive, // Others/Default
    type LucideIcon
} from "lucide-react";

export type CategoryTheme = {
    icon: LucideIcon;
    gradient: string;
    iconColor: string;
};

export const getCategoryTheme = (category: string): CategoryTheme => {
    const normalizedCategory = category.toLowerCase().trim();

    if (normalizedCategory.includes('electronic') || normalizedCategory.includes('phone') || normalizedCategory.includes('laptop')) {
        return {
            icon: Laptop,
            gradient: "from-blue-500/20 via-blue-400/10 to-transparent",
            iconColor: "text-blue-500"
        };
    }

    if (normalizedCategory.includes('wallet') || normalizedCategory.includes('id') || normalizedCategory.includes('card')) {
        return {
            icon: Wallet,
            gradient: "from-amber-500/20 via-amber-400/10 to-transparent",
            iconColor: "text-amber-500"
        };
    }

    if (normalizedCategory.includes('access') || normalizedCategory.includes('glass') || normalizedCategory.includes('watch')) {
        return {
            icon: Glasses,
            gradient: "from-purple-500/20 via-purple-400/10 to-transparent",
            iconColor: "text-purple-500"
        };
    }

    if (normalizedCategory.includes('book') || normalizedCategory.includes('note') || normalizedCategory.includes('document')) {
        return {
            icon: BookOpen,
            gradient: "from-emerald-500/20 via-emerald-400/10 to-transparent",
            iconColor: "text-emerald-500"
        };
    }

    if (normalizedCategory.includes('key')) {
        return {
            icon: Key,
            gradient: "from-yellow-500/20 via-yellow-400/10 to-transparent",
            iconColor: "text-yellow-500"
        };
    }

    if (normalizedCategory.includes('cloth') || normalizedCategory.includes('jacket') || normalizedCategory.includes('bag')) {
        return {
            icon: Shirt,
            gradient: "from-pink-500/20 via-pink-400/10 to-transparent",
            iconColor: "text-pink-500"
        };
    }

    // Default
    return {
        icon: Archive,
        gradient: "from-slate-500/20 via-slate-400/10 to-transparent",
        iconColor: "text-slate-500"
    };
};
