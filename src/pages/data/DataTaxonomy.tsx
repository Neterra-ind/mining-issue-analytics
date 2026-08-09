import { PageHeader } from '@/components/PageHeader'
import { TaxonomyEditor } from '@/components/taxonomy/TaxonomyEditor'

export default function DataTaxonomy() {
  return (
    <div>
      <PageHeader
        configKey="dataTaxonomy.title"
        title="Taxonomy Management"
        subtitleKey="dataTaxonomy.subtitle"
        subtitle="Kelola kategori Industry & ESG. Perubahan di sini langsung terlihat pada seluruh dashboard."
      />
      <TaxonomyEditor pillars={['Industry', 'ESG']} />
    </div>
  )
}
