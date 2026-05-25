interface Props {
  title: string;
}

export default function StudioTopbar({ title }: Props) {
  return (
    <div className="studio-topbar">
      <h1 className="studio-topbar-title">{title}</h1>
    </div>
  );
}
