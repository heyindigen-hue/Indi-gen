import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import TextareaAutosize from 'react-textarea-autosize';
import { SendIcon } from '@/icons';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  updated_at: string;
}

interface EmailEditorProps {
  template: EmailTemplate | null;
  open: boolean;
  onClose: () => void;
}

export function EmailEditor({ template, open, onClose }: EmailEditorProps) {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  useEffect(() => {
    if (template) {
      setSubject(template.subject);
      setBody(template.body);
    }
  }, [template]);

  const saveMutation = useMutation({
    mutationFn: () =>
      api.post(`/admin/templates/email/${template!.id}`, { subject, body }),
    onSuccess: () => {
      toast.success('Email template saved');
      queryClient.invalidateQueries({ queryKey: ['admin-templates-email'] });
    },
    onError: () => toast.error('Failed to save template'),
  });

  const handleVariableClick = (variable: string) => {
    navigator.clipboard.writeText(variable).then(() => {
      toast.success(`Copied ${variable}`);
    });
  };

  const handleTestSend = () => {
    console.log('todo: test send', template?.id);
    toast.info('Test send — coming soon');
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose(); }}>
      <SheetContent className="w-[480px] sm:max-w-[480px] flex flex-col gap-0 overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>{template?.name ?? 'Email Template'}</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-4 flex-1">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email-subject">Subject</Label>
            <Input
              id="email-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Email subject line"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email-body">Body (Markdown)</Label>
            <TextareaAutosize
              id="email-body"
              value={body}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setBody(e.target.value)}
              minRows={8}
              className={cn(
                'w-full resize-none rounded-md border border-input bg-transparent px-3 py-2',
                'text-sm font-mono text-foreground placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-1 focus:ring-ring',
              )}
              placeholder="Write email body in Markdown..."
            />
          </div>

          {template && template.variables.length > 0 && (
            <div className="flex flex-col gap-2">
              <Separator />
              <p className="text-xs font-medium text-muted-foreground">Variables — click to copy</p>
              <div className="flex flex-wrap gap-1.5">
                {template.variables.map((variable) => (
                  <button
                    key={variable}
                    onClick={() => handleVariableClick(variable)}
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono',
                      'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
                      'hover:opacity-80 transition-opacity cursor-pointer',
                    )}
                  >
                    {variable}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <SheetFooter className="pt-4 flex-row gap-2 justify-end">
          <Button variant="ghost" size="sm" onClick={handleTestSend}>
            <SendIcon size={14} className="mr-1.5" />
            Test send
          </Button>
          <Button
            size="sm"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
