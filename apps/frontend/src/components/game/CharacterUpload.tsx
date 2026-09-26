import { UploadCloud, ImageIcon } from 'lucide-react';

export function CharacterUpload() {
  return (
    <div className="group relative cursor-pointer rounded-2xl border-2 border-dashed border-border bg-secondary/20 p-8 transition-all hover:border-primary/50 hover:bg-secondary/30">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/20 transition-all group-hover:bg-primary/20">
          <UploadCloud className="h-7 w-7 text-primary" />
        </div>
        <div>
          <p className="font-semibold">Upload a photo</p>
          <p className="mt-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <ImageIcon className="h-3 w-3" /> JPG, PNG up to 10MB
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
