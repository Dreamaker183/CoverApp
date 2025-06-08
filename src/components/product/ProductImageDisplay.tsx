
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';

interface ProductImageDisplayProps {
  imageUrl: string | null;
  productName: string;
}

export default function ProductImageDisplay({ imageUrl, productName }: ProductImageDisplayProps) {
  const imageToDisplay = imageUrl || "https://placehold.co/600x400.png";
  // Determine hint based on whether it's a real image or placeholder
  const hint = imageUrl && !imageUrl.startsWith("https://placehold.co") ? "product photo" : "placeholder image";

  return (
    <Card className="overflow-hidden shadow-lg">
      <CardContent className="p-0">
        <div className="aspect-[3/2] relative w-full bg-muted">
          <Image
            src={imageToDisplay}
            alt={imageUrl ? `Image for ${productName}` : "Placeholder image"}
            layout="fill"
            objectFit="cover"
            data-ai-hint={hint}
          />
        </div>
      </CardContent>
    </Card>
  );
}
