import numpy as np
import pyfbx

def load_fbx(filename):
    # Carregar o arquivo FBX
    manager = pyfbx.FbxManager.Create()
    importer = pyfbx.FbxImporter.Create(manager, "")
    scene = pyfbx.FbxScene.Create(manager, "")
    importer.Initialize(filename, -1)
    importer.Import(scene)
    importer.Destroy()
    return scene

def get_mesh_vertices(mesh):
    vertices = []
    for i in range(mesh.GetControlPointsCount()):
        vertex = mesh.GetControlPointAt(i)
        vertices.append([vertex[0], vertex[1], vertex[2]])
    return np.array(vertices)

def calculate_center_of_gravity(vertices):
    return np.mean(vertices, axis=0)

def zero_transformations(node):
    # Zerar todas as transformações do nó
    node.LclTranslation.Set(pyfbx.FbxDouble3(0, 0, 0))
    node.LclRotation.Set(pyfbx.FbxDouble3(0, 0, 0))
    node.LclScaling.Set(pyfbx.FbxDouble3(1, 1, 1))

def save_fbx(scene, filename):
    manager = pyfbx.FbxManager.Create()
    exporter = pyfbx.FbxExporter.Create(manager, "")
    exporter.Initialize(filename, -1)
    exporter.Export(scene)
    exporter.Destroy()

def main(input_filename, output_filename):
    scene = load_fbx(input_filename)
    root_node = scene.GetRootNode()

    for i in range(root_node.GetChildCount()):
        child_node = root_node.GetChild(i)
        if child_node.GetNodeAttribute() and child_node.GetNodeAttribute().GetAttributeType() == pyfbx.FbxNodeAttribute.eMesh:
            mesh = child_node.GetNodeAttribute()
            vertices = get_mesh_vertices(mesh)
            center_of_gravity = calculate_center_of_gravity(vertices)

            # Centralizar o modelo pelo centro de gravidade
            for j in range(len(vertices)):
                vertices[j] -= center_of_gravity

            # Atualizar os vértices no mesh
            for j in range(len(vertices)):
                mesh.GetControlPoints()[j] = pyfbx.FbxVector4(vertices[j][0], vertices[j][1], vertices[j][2])

            # Zerar as transformações do nó
            zero_transformations(child_node)

    save_fbx(scene, output_filename)

if __name__ == "__main__":
    input_filename = "OakA.fbx"
    output_filename = "output.fbx"
    main(input_filename, output_filename)
