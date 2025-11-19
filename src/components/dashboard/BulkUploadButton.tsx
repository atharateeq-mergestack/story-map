'use client';

import { UploadIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { BulkUploadDialog } from './BulkUploadDialog';

export function BulkUploadButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <UploadIcon className="mr-2 size-4" />
        Bulk Upload
      </Button>
      <BulkUploadDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
