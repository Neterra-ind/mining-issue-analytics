import { PageHeader } from '@/components/PageHeader'
import { TaxonomyEditor } from '@/components/taxonomy/TaxonomyEditor'

export default function DataCategories() {
  return (
    <div>
      <PageHeader
        configKey="dataCategories.title"
        title="Categories"
        subtitleKey="dataCategories.subtitle"
        subtitle="Kelola kategori Reputation Topics yang digunakan pada Corporate Reputation Intelligence."
      />
      <TaxonomyEditor pillars={['Corporate']} />
    </div>
  )
}
