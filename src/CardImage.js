const CardImage = ({ title, src  }) => {
  return (
    <div>
      <p
        style={{
          fontSize: "13px",
          fontWeight: "600",
          color: "#4a5568",
        }}
      >
        {title}
      </p>
      {src ? (
        <img
          src={src}
          alt={title}
          style={{
            width: "100%",
            maxHeight: "350px",
            objectFit: "cover",
            borderRadius: "6px",
            border: "1px solid #cbd5e0",
          }}
        />
      ) : (
        <p style={{ fontSize: "12px", color: "#a0aec0" }}>
          Sem foto cadastrada
        </p>
      )}
    </div>
  );
};

export default CardImage;
