import re
with open("src/pages/AdminDashboard.tsx", "r") as f:
    text = f.read()

# Extract from 'function OpportunitiesManager' until 'function BlogManager'
start = text.find("function OpportunitiesManager")
end = text.find("function BlogManager")
if start != -1 and end != -1:
    content = text[start:end]
    with open("src/components/CompanyOpportunitiesManager.tsx", "w") as out:
        out.write("""import React, { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Edit2, Sparkles, Loader2, Star, Users, Plus, Download, Mail, CheckCircle, XCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

""")
        out.write("export " + content)
        print("Extraction successful")
    
