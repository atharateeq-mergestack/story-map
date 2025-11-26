'use client';

import { UploadIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { bulkUploadTours } from '@/actions/bulk-upload';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type BulkUploadDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function BulkUploadDialog({ open, onOpenChange }: BulkUploadDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');
      const isGeoJSON = file.type === 'application/geo+json'
        || file.type === 'application/json'
        || file.name.endsWith('.geojson');

      if (isCSV || isGeoJSON) {
        setSelectedFile(file);
      } else {
        toast.error('Invalid file type', {
          description: 'Please select a CSV or GeoJSON file',
        });
        setSelectedFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('No file selected', {
        description: 'Please select a CSV or GeoJSON file to upload',
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const result = await bulkUploadTours(formData);

      if (result.success) {
        toast.success('Bulk upload successful!', {
          description: result.message,
        });
        onOpenChange(false);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        // Refresh the page to show the new tour
        router.refresh();
      } else {
        toast.error('Upload failed', {
          description: result.error || result.message,
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!loading) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bulk Upload Tours</DialogTitle>
          <DialogDescription>
            Upload a CSV or GeoJSON file to create a tour with multiple destinations at once.
            CSV: The first row should contain tour information, and subsequent rows should contain destination data.
            GeoJSON: Each feature represents a destination with properties like Name, Day, Location, etc.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label
              htmlFor="csv-file"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              CSV File
            </label>
            <div className="flex items-center gap-4">
              <input
                ref={fileInputRef}
                id="csv-file"
                type="file"
                accept=".csv,text/csv,.geojson,application/geo+json,application/json"
                onChange={handleFileChange}
                disabled={loading}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Selected:
                {' '}
                {selectedFile.name}
                {' '}
                (
                {(selectedFile.size / 1024).toFixed(2)}
                {' '}
                KB)
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              CSV: Required columns: tour_name, destination_name, destination_date
              <br />
              GeoJSON: Each feature should have properties: Name, Day, Location, and geometry with coordinates
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={loading || !selectedFile}
          >
            {loading
              ? (
                  <>
                    <span className="mr-2">Uploading...</span>
                  </>
                )
              : (
                  <>
                    <UploadIcon className="mr-2 size-4" />
                    Upload
                  </>
                )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
