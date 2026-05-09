import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mail, Tag, CheckCircle, Trash2, User, ExternalLink, ShoppingBag, Edit } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import defaultProductPreview from "@/assets/default-product-preview.png";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ... inside the component ...
export function ItemCard({ item, isOwner, onStatusChange, onDelete, onEdit, isLoggedIn }: any) {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [imageError, setImageError] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const handleContact = () => {
        if (!isLoggedIn) {
            toast({
                title: "Login Required",
                description: "You must be logged in to contact the seller.",
                variant: "destructive"
            });
            navigate("/auth");
            return;
        }
        window.location.href = `mailto:${item.profiles?.email || 'student@college.edu'}?subject=Buying: ${item.title}`;
    };

    return (
        <Card
            className="group overflow-hidden bg-card border-border/50 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col h-full w-full"
            onClick={() => navigate(`/marketplace/${item.id}`)}
        >
            {/* Image Area */}
            <div className="aspect-[4/3] bg-black/40 relative overflow-hidden">
                <img
                    src={item.image_url || defaultProductPreview}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    onError={(e) => {
                        e.currentTarget.src = defaultProductPreview;
                    }}
                />


                {item.status !== 'approved' && item.status !== 'available' && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                        <Badge variant={item.status === 'sold' ? "secondary" : "destructive"} className="px-4 py-2 text-lg font-bold shadow-lg uppercase tracking-widest">
                            {item.status}
                        </Badge>
                    </div>
                )}
            </div>

            {/* Content */}
            <CardContent className="p-2.5 sm:p-5 flex flex-col flex-1">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-1 sm:gap-4 mb-2 sm:mb-3">
                    <h3 className="font-display font-semibold text-sm sm:text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors" title={item.title}>
                        {item.title}
                    </h3>
                    <span className="font-mono font-bold text-base sm:text-xl text-primary whitespace-nowrap">
                        ₹{item.price}
                    </span>
                </div>

                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2 sm:mb-4 h-8 sm:h-10 leading-relaxed">
                    {item.description}
                </p>

                <div
                    className="flex items-center gap-1.5 sm:gap-2.5 text-[10px] sm:text-xs text-muted-foreground/80 py-2 border-t border-border/50 hover:bg-secondary/30 transition-colors px-1 -mx-1 rounded-sm cursor-pointer mt-auto"
                    onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/profile/${item.seller_id}`);
                    }}
                >
                    <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-tr from-primary/20 to-secondary/20 flex items-center justify-center ring-1 ring-border">
                        {item.profiles?.avatar_url ? (
                            <img src={item.profiles.avatar_url} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
                        )}
                    </div>
                    <span className="font-medium truncate max-w-[80px] sm:max-w-none hover:underline underline-offset-2 decoration-primary/50">
                        {item.profiles?.full_name || "Student"}
                    </span>
                    <span className="opacity-50 hidden sm:inline">•</span>
                    <span className="hidden sm:inline">{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
            </CardContent>

            {/* Footer Actions */}
            <CardFooter className="p-2.5 sm:p-4 pt-0 gap-2" onClick={(e) => e.stopPropagation()}>
                {isOwner ? (
                    <>
                        {item.status !== 'sold' && (
                            <Button
                                variant="outline"
                                className="flex-1 gap-2 border-primary/20 hover:bg-primary/5 text-primary h-8 sm:h-9 text-xs sm:text-sm px-2"
                                onClick={() => onStatusChange(item.id, 'sold')}
                            >
                                <CheckCircle className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Mark Sold</span><span className="sm:hidden">Sold</span>
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 sm:h-9 sm:w-9 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsDeleteDialogOpen(true);
                            }}
                        >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:bg-secondary hover:text-foreground"
                            onClick={(e) => {
                                e.stopPropagation();
                                onEdit(item);
                            }}
                        >
                            <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </Button>
                    </>
                ) : (
                    <Button
                        className="w-full gap-2 h-8 sm:h-10 shadow-lg shadow-primary/10 group-hover:shadow-primary/20 transition-all text-xs sm:text-sm"
                        disabled={item.status === 'sold' || item.status === 'pending'}
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/marketplace/${item.id}`);
                        }}
                        variant="default"
                    >
                        <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:animate-bounce-subtle" />
                        {isLoggedIn ? "Buy Now" : "Login"}
                    </Button>
                )}
            </CardFooter>

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="w-[90%] max-w-[380px] rounded-2xl border-border/50 shadow-large" onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold">Delete Listing?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            Are you sure you want to delete this listing? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2 sm:gap-0">
                        <AlertDialogCancel className="rounded-xl border-border/50 hover:bg-secondary">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl px-6"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(item.id);
                                setIsDeleteDialogOpen(false);
                            }}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
