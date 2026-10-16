import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { DocExample, DocSection } from '../components/DocSection';

// Contoh skema. Di fitur nyata, skema ada di file <fitur>Schema.ts dan dites.
const exampleSchema = z.object({
  nama: z.string().trim().min(1, 'Nama produk wajib diisi'),
  stokMinimum: z.coerce.number().min(0, 'Stok minimum tidak boleh negatif'),
});

type ExampleInput = z.input<typeof exampleSchema>;
type ExampleValues = z.output<typeof exampleSchema>;

const ExampleForm: React.FC = () => {
  const { showToast } = useToast();
  const form = useForm<ExampleInput, unknown, ExampleValues>({
    resolver: zodResolver(exampleSchema),
    defaultValues: { nama: '', stokMinimum: 0 },
  });

  const onSubmit = (values: ExampleValues) => {
    showToast(`Tersimpan: ${values.nama} (min ${values.stokMinimum})`, 'success');
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid w-full max-w-sm gap-4">
        <FormField
          control={form.control}
          name="nama"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Produk</FormLabel>
              <FormControl>
                <Input placeholder="Kosongkan lalu simpan" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="stokMinimum"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stok Minimum</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  {...field}
                  value={field.value === undefined ? '' : String(field.value)}
                />
              </FormControl>
              <FormDescription>Coba isi angka negatif.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="justify-self-start">
          Simpan
        </Button>
      </form>
    </Form>
  );
};

export const FormDocs: React.FC = () => (
  <DocSection
    id="form"
    title="Form (react-hook-form + zod)"
    description="Semua form memakai react-hook-form dengan skema zod. Skema diletakkan di <fitur>Schema.ts dan dites; pesan error tampil per field lewat FormMessage."
    importPath="import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';"
  >
    <DocExample
      title="Validasi per field"
      note="Contoh ini benar-benar jalan: kosongkan nama atau isi stok negatif lalu tekan Simpan."
      code={`
const schema = z.object({
  nama: z.string().trim().min(1, 'Nama produk wajib diisi'),
  stokMinimum: z.coerce.number().min(0, 'Stok minimum tidak boleh negatif'),
});

const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { nama: '', stokMinimum: 0 },
});

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="nama"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Nama Produk</FormLabel>
          <FormControl><Input {...field} /></FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
    <Button type="submit" disabled={mutation.isPending}>Simpan</Button>
  </form>
</Form>`}
    >
      <ExampleForm />
    </DocExample>
  </DocSection>
);
