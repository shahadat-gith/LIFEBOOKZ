import { useEffect, useState } from "react";
import { Icons } from "../../icons";


 value: File | null;
 onChange: (file: File | null) => void;
}

export default function AvatarUploader({
 value,
 onChange,
}: AvatarUploaderProps) {
 const [preview, setPreview] = useState("");

 useEffect(() => {
  if (!value) {
   setPreview("");
   return;
  }

  const url = URL.createObjectURL(value);
  setPreview(url);

  return () => URL.revokeObjectURL(url);
 }, [value]);

 return (
  <div className="flex flex-col items-center">
   <label className="group relative cursor-pointer">
    <input
     type="file"
     accept="image/*"
     hidden
     onChange={(e) => onChange(e.target.files?.[0] ?? null)}
    />

    <div className="h-32 w-32 overflow-hidden rounded-full border-2 border-dashed border-border bg-muted transition group-hover:border-primary">
     {preview ? (
      <img
       src={preview}
       alt="Avatar"
       className="h-full w-full object-cover"
      />
     ) : (
      <div className="flex h-full w-full items-center justify-center">
       <Icons.user className="h-10 w-10 text-muted-foreground" />
      </div>
     )}
    </div>

    <div className="absolute bottom-1 right-1 rounded-full bg-primary p-2 text-white shadow-lg">
     <Icons.camera className="h-4 w-4" />
    </div>
   </label>

   <p className="mt-3 text-xs text-muted-foreground">
    JPG, PNG • Max 10 MB
   </p>

   {value && (
    <p className="mt-1 max-w-[180px] truncate text-center text-sm">
     {value.name}
    </p>
   )}
  </div>
 );
}