-- Tabela para Categorias Prontos
CREATE TABLE public.ready_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.ready_categories ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para ready_categories
CREATE POLICY "Ready categories are publicly readable" 
ON public.ready_categories FOR SELECT USING (true);

CREATE POLICY "Admins can insert ready categories" 
ON public.ready_categories FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ready categories" 
ON public.ready_categories FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ready categories" 
ON public.ready_categories FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Tabela para Produtos Prontos
CREATE TABLE public.ready_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.ready_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  image_url TEXT,
  quantity_available INTEGER NOT NULL DEFAULT 0,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.ready_products ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para ready_products
CREATE POLICY "Ready products are publicly readable" 
ON public.ready_products FOR SELECT USING (true);

CREATE POLICY "Admins can insert ready products" 
ON public.ready_products FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update ready products" 
ON public.ready_products FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete ready products" 
ON public.ready_products FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_ready_products_updated_at
BEFORE UPDATE ON public.ready_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime para atualizações de estoque
ALTER PUBLICATION supabase_realtime ADD TABLE public.ready_products;