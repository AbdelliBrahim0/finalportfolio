interface IdentityBlockProps {
  revealActive: boolean
}

const IdentityBlock = ({ revealActive }: IdentityBlockProps) => (
  <section
    className={`identity-block${revealActive ? ' is-revealed' : ''}`}
    aria-label="Professional identity and links"
  >
  </section>
)

export default IdentityBlock
