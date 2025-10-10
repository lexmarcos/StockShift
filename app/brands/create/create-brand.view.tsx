'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import Link from 'next/link';
import type { CreateBrandFormData } from './create-brand.types';

interface CreateBrandViewProps {
  formData: CreateBrandFormData;
  isLoading: boolean;
  error: string | null;
  success: boolean;
  onInputChange: (field: keyof CreateBrandFormData, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function CreateBrandView({
  formData,
  isLoading,
  error,
  success,
  onInputChange,
  onSubmit,
}: CreateBrandViewProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            Criar Marca
          </CardTitle>
          <CardDescription>
            Preencha os dados para cadastrar uma nova marca
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription>
                  Marca criada com sucesso!
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">
                Nome da Marca <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Digite o nome da marca (2-100 caracteres)"
                value={formData.name}
                onChange={(e) => onInputChange('name', e.target.value)}
                disabled={isLoading || success}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                {formData.name.length}/100 caracteres
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Descrição <span className="text-muted-foreground text-xs">(opcional)</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Digite uma descrição para a marca (até 1000 caracteres)"
                value={formData.description}
                onChange={(e) => onInputChange('description', e.target.value)}
                disabled={isLoading || success}
                maxLength={1000}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/1000 caracteres
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={isLoading || success}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Spinner className="h-4 w-4" />
                    <span>Criando...</span>
                  </div>
                ) : (
                  'Criar Marca'
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={isLoading}
                asChild
              >
                <Link href="/brands">
                  Cancelar
                </Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
